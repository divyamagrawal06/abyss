import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { keccak256, encodePacked, toHex } from 'viem'
import { fetchTxAutoDetect, fetchReceiptOnNetwork } from '@/lib/rpc'

// Contracts we can identify deterministically (used for partial_decode flag)
const KNOWN_CONTRACTS: Record<string, string> = {
  '0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8': 'WMNT (Wrapped MNT)',
  '0xdeaddeaddeaddeaddeaddeaddeaddeaddeadead1': 'WETH (Bridged ETH)',
  '0x319b69888b0d11cec22caa5034e25fffbdc88421': 'Agni Finance Router',
  '0xecc19e177d24551aa7ed6bc6fe566eca726cc8a9': 'FusionX Router',
  '0x9f0ef9c75d6f0e33a5de97e43abaac37bbebf0b0': 'Lendle Lending Protocol',
}

// Stable system prompt — cached at the prefix to save tokens across requests
const SYSTEM_PROMPT = `You are "Abyss Lens" — a transaction explainer for the Mantle blockchain. Your audience is someone completely new to crypto.

Given a JSON object of on-chain transaction data, write a plain-English explanation in 3–6 sentences.

Rules:
1. Write for a beginner. If you use a technical term, briefly define it in parentheses.
2. Always cite specific field names from the data (e.g., "the 'status' field shows...").
3. Never fabricate information. If something is unknown, say "unknown" or "could not be determined".
4. If partial_decode is true, acknowledge the exact contract action could not be identified from available data.
5. Cover: what happened overall, who sent it (from), where it went (to), did it succeed (status), how much computation was used (gasUsed vs gasLimit).
6. Keep the tone reassuring and educational. Do not be condescending.

Field reference:
- status: "success" = completed as intended; "failed" = something prevented it (e.g., ran out of gas, or the contract rejected it)
- from: the wallet address that sent the transaction
- to: the destination address (null = a new contract was deployed)
- value: MNT (Mantle native token) sent, expressed in wei (1 MNT = 10^18 wei; value "0x0" means no MNT was transferred)
- gasUsed / gasLimit: gasUsed = actual computation performed; gasLimit = maximum allowed
- logsCount: number of events emitted by contracts (more events often means more activity inside contracts)
- partial_decode: true = we could not identify which contract function was called
- knownContractName: the name of the destination contract if recognized; null if unrecognized

Output: plain prose only, 3–6 sentences, no markdown, no bullet points.`

// Deterministic: computed before calling LLM, passed as input so model knows confidence level
function computePartialDecode(to: string | null, input: string): boolean {
  if (!input || input === '0x' || input.length <= 2) return false // plain ETH transfer
  if (!to) return false // contract creation — clearly identifiable
  return !KNOWN_CONTRACTS[to.toLowerCase()]
}

export async function POST(req: NextRequest) {
  let body: { hash?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { hash } = body
  if (!hash || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return NextResponse.json(
      { error: 'Invalid transaction hash. Must be 0x followed by 64 hex characters.' },
      { status: 400 }
    )
  }

  // Auto-detect which Mantle network the tx lives on (tries testnet + mainnet in parallel)
  let detected: Awaited<ReturnType<typeof fetchTxAutoDetect>>
  try {
    detected = await fetchTxAutoDetect(hash)
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not reach Mantle RPC. Please try again.', details: String(err) },
      { status: 502 }
    )
  }

  if (!detected) {
    return NextResponse.json(
      { error: 'Transaction not found on Mantle Sepolia or Mantle mainnet. Double-check the hash.' },
      { status: 404 }
    )
  }

  const { tx, network } = detected
  let receipt
  try {
    receipt = await fetchReceiptOnNetwork(hash, network)
  } catch {
    receipt = null
  }

  const partial_decode = computePartialDecode(tx.to, tx.input)
  const toAddr = tx.to?.toLowerCase() ?? null

  // Structured payload — raw calldata (tx.input) intentionally excluded to keep LLM context clean
  const evidence = {
    schema_version: '1.0',
    txHash: tx.hash,
    status: receipt
      ? receipt.status === '0x1' ? 'success' : 'failed'
      : 'pending',
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gasLimit: tx.gas,
    gasUsed: receipt?.gasUsed ?? 'pending',
    blockNumber: receipt?.blockNumber
      ? parseInt(receipt.blockNumber, 16)
      : null,
    logsCount: receipt?.logs.length ?? 0,
    logs: (receipt?.logs ?? []).slice(0, 5).map(l => ({
      address: l.address,
      topics: l.topics,
    })),
    contractAddressTouched: tx.to ?? receipt?.contractAddress ?? null,
    knownContractName: toAddr ? (KNOWN_CONTRACTS[toAddr] ?? null) : null,
    isContractCreation: tx.to === null,
    partial_decode,
    chain_id: network === 'mainnet' ? 5000 : 5003,
    network,
  }

  // Canonical JSON with sorted keys — deterministic payload for M3 attestation hash
  const canonicalJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(evidence).sort(([a], [b]) => a.localeCompare(b))
    )
  )

  let interpretation = ''
  try {
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
    const aiRes = await client.messages.create({
      model: (process.env.TX_MODEL ?? 'claude-haiku-4-5') as string,
      max_tokens: 512,
      system: [
        {
          type: 'text' as const,
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [{ role: 'user', content: canonicalJson }],
    })
    for (const block of aiRes.content) {
      if (block.type === 'text') {
        interpretation = block.text
        break
      }
    }
  } catch (err) {
    console.error('Claude API error:', err)
    interpretation = 'Interpretation unavailable — AI service error. The on-chain evidence above is accurate.'
  }

  // Precompute attestation values for M3 — client just passes these to the contract
  // contentId = keccak256(abi.encodePacked("tx", txHash_as_bytes32))
  // contentHash = keccak256(bytes(canonicalJson)) — commits to the exact payload the LLM saw
  const attestData = {
    contentId: keccak256(encodePacked(['string', 'bytes32'], ['tx', hash as `0x${string}`])),
    contentHash: keccak256(toHex(canonicalJson)),
    meta: 'abyss:tx:v1.0',
  }

  const explorerBase =
    network === 'mainnet'
      ? 'https://explorer.mantle.xyz'
      : 'https://explorer.sepolia.mantle.xyz'

  return NextResponse.json({ evidence, interpretation, explorerUrl: `${explorerBase}/tx/${hash}`, attestData })
}
