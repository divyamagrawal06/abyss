'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface Approval {
  token: { address: string; symbol: string; name: string; decimals: number }
  spender: { address: string; name: string; kind: string }
  risk: 'unlimited' | 'large' | 'finite'
  displayAmount: string
}

interface ScanResult {
  approvals: Approval[]
  network: string
  scannedTokens: number
  scannedSpenders: number
}

const RISK_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  unlimited: { bg: 'rgba(239,68,68,0.12)', color: 'var(--color-danger)', label: 'Unlimited' },
  large: { bg: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)', label: 'Large' },
  finite: { bg: 'rgba(107,122,153,0.12)', color: 'var(--color-muted)', label: 'Finite' },
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function Pulse({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded ${className}`}
         style={{ background: 'var(--color-surface-raised)' }} />
  )
}

export default function ApprovalsPage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScan = async () => {
    if (!address) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Scan failed.')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full">
      <Link href="/" className="text-sm mb-8 inline-block" style={{ color: 'var(--color-muted)' }}>
        ← Back
      </Link>

      <h1 className="text-3xl font-bold mb-2">Approval Check</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        See which contracts can move your tokens — especially unlimited approvals.
        Scans your address against Mantle mainnet.
      </p>

      {/* Wallet connection */}
      <div className="rounded-xl border p-5 mb-6"
           style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        {!isConnected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <div className="text-sm font-semibold mb-1">Connect your wallet to scan</div>
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Read-only — we never ask for your seed phrase or request signatures
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {connectors.map(connector => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  className="text-sm px-4 py-2 rounded-lg font-semibold cursor-pointer"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Connected</div>
              <div className="font-mono text-sm">{address}</div>
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <button
                onClick={handleScan}
                disabled={loading}
                className="text-sm px-5 py-2 rounded-lg font-semibold cursor-pointer disabled:opacity-40"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                {loading ? 'Scanning…' : result ? 'Scan again' : 'Scan approvals'}
              </button>
              <button
                onClick={() => { disconnect(); setResult(null); setError(null) }}
                className="text-sm px-4 py-2 rounded-lg border cursor-pointer"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border p-4 text-sm mb-6"
             style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: 'rgba(239,68,68,0.06)' }}
             role="alert">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 flex gap-4"
                 style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <Pulse className="h-5 w-16" />
              <Pulse className="h-5 flex-1" />
              <Pulse className="h-5 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Scanned {result.scannedTokens} tokens × {result.scannedSpenders} spenders on{' '}
            <span style={{ color: 'var(--color-foreground)' }}>{result.network}</span>
            {' '}— found{' '}
            <span style={{ color: result.approvals.length > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
              {result.approvals.length} active approval{result.approvals.length !== 1 ? 's' : ''}
            </span>
          </div>

          {result.approvals.length === 0 ? (
            <div className="rounded-xl border p-8 text-center"
                 style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <div className="text-2xl mb-3">✓</div>
              <div className="font-semibold mb-1">No active approvals found</div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                None of the scanned tokens have spending permissions set for known Mantle protocols.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden"
                 style={{ borderColor: 'var(--color-border)' }}>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider"
                   style={{ background: 'var(--color-surface-raised)', color: 'var(--color-muted)' }}>
                <span>Token</span>
                <span>Spender</span>
                <span>Allowance</span>
                <span>Risk</span>
              </div>

              {result.approvals.map((a, i) => {
                const risk = RISK_STYLE[a.risk]
                return (
                  <div key={i}
                       className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-4 items-center border-t"
                       style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                    {/* Token */}
                    <div>
                      <div className="font-semibold text-sm">{a.token.symbol}</div>
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{a.token.name}</div>
                    </div>

                    {/* Spender */}
                    <div>
                      <div className="text-sm">{a.spender.name}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}
                           title={a.spender.address}>
                        {shortAddr(a.spender.address)} · {a.spender.kind}
                      </div>
                    </div>

                    {/* Allowance */}
                    <div className="text-sm font-mono text-right">
                      {a.displayAmount}
                    </div>

                    {/* Risk badge */}
                    <div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: risk.bg, color: risk.color }}>
                        {risk.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* External revoke link */}
          {result.approvals.some(a => a.risk === 'unlimited') && (
            <div className="rounded-xl border p-4 flex items-start gap-3"
                 style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)' }}>
              <span className="text-lg">⚠️</span>
              <div>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-danger)' }}>
                  Unlimited approval detected
                </div>
                <div className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
                  An unlimited approval means the spender can move any amount of that token from your wallet at any time.
                  Consider revoking it if you no longer use that protocol.
                </div>
                <a href="https://revoke.cash" target="_blank" rel="noopener noreferrer"
                   className="text-xs font-semibold"
                   style={{ color: 'var(--color-accent)' }}>
                  Revoke on revoke.cash ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational strip */}
      <div className="mt-12 pt-8 border-t space-y-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          Glossary
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              term: 'Allowance',
              def: 'Permission you gave a contract to spend tokens from your wallet. Required to use most DeFi apps.',
            },
            {
              term: 'Spender',
              def: 'The smart contract that received permission. Common spenders are DEX routers and lending protocols.',
            },
            {
              term: 'Unlimited',
              def: 'No spending cap set — the contract can take any amount of that token at any time. Convenient but risky.',
            },
          ].map(({ term, def }) => (
            <div key={term} className="rounded-lg p-4"
                 style={{ background: 'var(--color-surface)' }}>
              <div className="text-sm font-semibold mb-1">{term}</div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>{def}</div>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          This scan covers a curated list of tokens and known Mantle protocols — not your full approval history.
          It is not a security audit. Verify on-chain evidence before revoking.
        </p>
      </div>
    </main>
  )
}
