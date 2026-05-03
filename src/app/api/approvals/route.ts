import { NextRequest, NextResponse } from 'next/server'

// Approval Check always scans Mantle mainnet — that's where real DeFi activity lives
const MAINNET_RPC = 'https://rpc.mantle.xyz'

// Curated Mantle mainnet tokens — verify addresses at explorer.mantle.xyz before production
const TOKENS = [
  { address: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', symbol: 'WMNT', name: 'Wrapped MNT', decimals: 18 },
  { address: '0xdEAddEaDdeadDEadDEADDEaddEADdEAddead1111', symbol: 'WETH', name: 'Bridged ETH', decimals: 18 },
  { address: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { address: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { address: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0', symbol: 'mETH', name: 'Mantle Staked ETH', decimals: 18 },
]

// Known protocol spenders on Mantle mainnet
const SPENDERS = [
  { address: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421', name: 'Agni Finance', kind: 'DEX' },
  { address: '0xECc19E177d24551aA7ed6Bc6FE566eCa726CC8a9', name: 'FusionX', kind: 'DEX' },
  { address: '0x9f0ef9c75D6f0e33A5De97e43aBaC37BBEbF0B0D', name: 'Lendle', kind: 'Lending' },
]

// allowance(address,address) → bytes4 selector
const ALLOWANCE_SELECTOR = 'dd62ed3e'
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
const UNLIMITED_THRESHOLD = MAX_UINT256 / 2n

function encodeAllowanceCall(owner: string, spender: string): string {
  const pad = (addr: string) => addr.replace('0x', '').toLowerCase().padStart(64, '0')
  return `0x${ALLOWANCE_SELECTOR}${pad(owner)}${pad(spender)}`
}

type Risk = 'unlimited' | 'large' | 'finite' | 'zero'

function classifyAllowance(hexResult: string, decimals: number): { value: bigint; risk: Risk } {
  const zeroResult = { value: 0n, risk: 'zero' as const }
  if (!hexResult || hexResult === '0x') return zeroResult
  const trimmed = hexResult.replace(/^0x0*$/, '')
  if (!trimmed || trimmed === '0x') return zeroResult

  const value = BigInt(hexResult)
  if (value === 0n) return zeroResult
  if (value >= UNLIMITED_THRESHOLD) return { value, risk: 'unlimited' }

  // "large" = more than 10,000 whole tokens
  const largeThreshold = 10_000n * (10n ** BigInt(decimals))
  if (value >= largeThreshold) return { value, risk: 'large' }

  return { value, risk: 'finite' }
}

function formatAmount(value: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals)
  const whole = value / divisor
  const frac = value % divisor
  if (frac === 0n) return whole.toLocaleString()
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '')
  return `${whole.toLocaleString()}.${fracStr.slice(0, 4)}`
}

async function getAllowance(tokenAddress: string, owner: string, spender: string): Promise<string | null> {
  try {
    const res = await fetch(MAINNET_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: tokenAddress, data: encodeAllowanceCall(owner, spender) }, 'latest'],
        id: 1,
      }),
      cache: 'no-store',
    })
    const json = await res.json()
    if (json.error || !json.result) return null
    return json.result as string
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  let body: { address?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { address } = body
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  // Scan all token × spender combinations in parallel
  const calls = TOKENS.flatMap(token =>
    SPENDERS.map(spender => ({ token, spender }))
  )

  const results = await Promise.all(
    calls.map(async ({ token, spender }) => {
      const hexResult = await getAllowance(token.address, address, spender.address)
      if (!hexResult) return null

      const { value, risk } = classifyAllowance(hexResult, token.decimals)
      if (risk === 'zero') return null

      return {
        token: { address: token.address, symbol: token.symbol, name: token.name, decimals: token.decimals },
        spender: { address: spender.address, name: spender.name, kind: spender.kind },
        risk,
        displayAmount: risk === 'unlimited' ? 'Unlimited' : formatAmount(value, token.decimals),
      }
    })
  )

  const approvals = results.filter(Boolean)

  return NextResponse.json({
    approvals,
    network: 'Mantle mainnet',
    scannedTokens: TOKENS.length,
    scannedSpenders: SPENDERS.length,
  })
}
