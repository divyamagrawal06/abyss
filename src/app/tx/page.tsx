'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWriteContract, useAccount } from 'wagmi'

const ATTEST_ABI = [
  {
    name: 'attest',
    type: 'function',
    inputs: [
      { name: 'contentId', type: 'bytes32' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'meta', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

interface TxEvidence {
  schema_version: string
  txHash: string
  status: 'success' | 'failed' | 'pending'
  from: string
  to: string | null
  value: string
  gasLimit: string
  gasUsed: string
  blockNumber: number | null
  logsCount: number
  logs: Array<{ address: string; topics: string[] }>
  contractAddressTouched: string | null
  knownContractName: string | null
  isContractCreation: boolean
  partial_decode: boolean
  chain_id: number
}

interface TxResult {
  evidence: TxEvidence
  interpretation: string
  explorerUrl: string
  attestData?: {
    contentId: `0x${string}`
    contentHash: `0x${string}`
    meta: string
  }
}

function formatWei(hexWei: string): string {
  if (!hexWei || hexWei === '0x0' || hexWei === '0x') return '0 MNT'
  try {
    const mnt = parseInt(hexWei, 16) / 1e18
    if (mnt === 0) return '0 MNT'
    if (mnt < 0.000001) return `${parseInt(hexWei, 16)} wei`
    return `${mnt.toFixed(6)} MNT`
  } catch {
    return hexWei
  }
}

function hexToDec(hex: string): string {
  if (!hex || hex === 'pending') return hex
  try {
    return parseInt(hex, 16).toLocaleString()
  } catch {
    return hex
  }
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-1 py-2.5 border-b last:border-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span
        className="text-xs font-mono w-36 shrink-0 pt-0.5"
        style={{ color: 'var(--color-muted)' }}
      >
        {label}
      </span>
      <span className="text-sm font-mono break-all">{children}</span>
    </div>
  )
}

function Pulse({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--color-surface-raised)' }}
    />
  )
}

export default function TxPage() {
  const [hash, setHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TxResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { isConnected } = useAccount()
  const { writeContract, isPending: attestPending, data: attestTxHash, isSuccess: attestSuccess } =
    useWriteContract()

  const contractAddress = process.env.NEXT_PUBLIC_ATTEST_CONTRACT as `0x${string}` | undefined

  const handleAttest = () => {
    if (!result?.attestData || !contractAddress) return
    writeContract({
      address: contractAddress,
      abi: ATTEST_ABI,
      functionName: 'attest',
      args: [result.attestData.contentId, result.attestData.contentHash, result.attestData.meta],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = hash.trim()
    if (!trimmed) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    const ev = result.evidence
    const text = [
      `${ev.status.toUpperCase()} · ${ev.txHash}`,
      result.interpretation,
      result.explorerUrl,
    ].join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ev = result?.evidence

  return (
    <main className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
      <Link
        href="/"
        className="text-sm mb-8 inline-block transition-colors"
        style={{ color: 'var(--color-muted)' }}
      >
        ← Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Tx Translator</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        Paste a Mantle transaction hash. We&apos;ll unpack what happened — with
        receipts to prove it.
      </p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={hash}
          onChange={e => setHash(e.target.value)}
          placeholder="0x..."
          className="flex-1 rounded-lg px-4 py-3 font-mono text-sm border focus:outline-none focus-visible:ring-2"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-foreground)',
          }}
          spellCheck={false}
          autoComplete="off"
          aria-label="Transaction hash"
        />
        <button
          type="submit"
          disabled={loading || !hash.trim()}
          className="rounded-lg px-5 py-3 text-sm font-semibold transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          {loading ? 'Translating…' : 'Translate'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl border p-4 text-sm mb-6"
          style={{
            borderColor: 'var(--color-danger)',
            color: 'var(--color-danger)',
            background: 'rgba(239,68,68,0.06)',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading">
          <Pulse className="h-7 w-28" />
          <div
            className="rounded-xl border p-5 space-y-3"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <Pulse className="h-4 w-20" />
            <Pulse className="h-4 w-full" />
            <Pulse className="h-4 w-4/5" />
            <Pulse className="h-4 w-3/5" />
          </div>
          <div
            className="rounded-xl border p-5 space-y-3"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Pulse key={i} className={`h-3 ${i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && ev && (
        <div className="space-y-6">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                background:
                  ev.status === 'success'
                    ? 'rgba(34,197,94,0.15)'
                    : ev.status === 'failed'
                    ? 'rgba(239,68,68,0.15)'
                    : 'rgba(245,158,11,0.15)',
                color:
                  ev.status === 'success'
                    ? 'var(--color-success)'
                    : ev.status === 'failed'
                    ? 'var(--color-danger)'
                    : 'var(--color-warning)',
              }}
            >
              {ev.status}
            </span>
            {ev.partial_decode && (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(107,122,153,0.15)',
                  color: 'var(--color-muted)',
                }}
                title="The transaction called a contract function we could not identify"
              >
                Partial decode
              </span>
            )}
            {ev.isContractCreation && (
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
                style={{
                  background: 'rgba(59,111,255,0.15)',
                  color: 'var(--color-accent)',
                }}
              >
                Contract creation
              </span>
            )}
          </div>

          {/* Interpretation */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  background: 'var(--color-accent-dim)',
                  color: 'var(--color-accent)',
                }}
              >
                AI Interpretation
              </span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                educational only · verify evidence below
              </span>
            </div>
            <p className="text-sm leading-relaxed">{result.interpretation}</p>
          </div>

          {/* Evidence */}
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--color-muted)' }}
            >
              On-chain Evidence
            </div>

            <Row label="status">{ev.status}</Row>
            <Row label="from">
              <span title={ev.from}>{shortAddr(ev.from)}</span>
            </Row>
            <Row label="to">
              {ev.isContractCreation ? (
                <span style={{ color: 'var(--color-accent)' }}>
                  contract deployment
                </span>
              ) : ev.to ? (
                <span className="flex items-center gap-2 flex-wrap" title={ev.to}>
                  {shortAddr(ev.to)}
                  {ev.knownContractName && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--color-accent-dim)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {ev.knownContractName}
                    </span>
                  )}
                </span>
              ) : (
                'null'
              )}
            </Row>
            <Row label="value">{formatWei(ev.value)}</Row>
            <Row label="gasUsed">
              {ev.gasUsed !== 'pending'
                ? `${hexToDec(ev.gasUsed)} / ${hexToDec(ev.gasLimit)} limit`
                : 'pending'}
            </Row>
            <Row label="block">
              {ev.blockNumber ? ev.blockNumber.toLocaleString() : 'pending'}
            </Row>
            <Row label="events">
              {ev.logsCount} emitted
            </Row>
            <Row label="partial decode">
              {ev.partial_decode ? 'yes — contract call not identified' : 'no'}
            </Row>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            >
              Open in Explorer ↗
            </a>
            <button
              onClick={handleCopy}
              className="text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer"
              style={{
                borderColor: 'var(--color-border)',
                color: copied ? 'var(--color-success)' : 'var(--color-muted)',
              }}
            >
              {copied ? '✓ Copied' : 'Copy Summary'}
            </button>

            {/* Attest button — only shown when contract address is configured */}
            {contractAddress && result.attestData && (
              <button
                onClick={handleAttest}
                disabled={attestPending || attestSuccess || !isConnected}
                className="text-sm px-4 py-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40"
                style={{
                  borderColor: attestSuccess ? 'var(--color-success)' : 'var(--color-accent)',
                  color: attestSuccess ? 'var(--color-success)' : 'var(--color-accent)',
                }}
                title={!isConnected ? 'Connect wallet to attest' : undefined}
              >
                {attestSuccess
                  ? '✓ Attested on-chain'
                  : attestPending
                  ? 'Confirming…'
                  : 'Seal interpretation on-chain'}
              </button>
            )}
          </div>

          {/* Attest tx link */}
          {attestTxHash && (
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Attestation tx:{' '}
              <a
                href={`${result.explorerUrl.replace(/\/tx\/.*/, '')}/tx/${attestTxHash}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-accent)' }}
              >
                {attestTxHash.slice(0, 10)}… ↗
              </a>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
