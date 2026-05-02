import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-16">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Mantle moves fast.
          <br />
          <span style={{ color: 'var(--color-accent)' }}>Abyss</span> helps you
          read it.
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-muted)' }}>
          Two tools. No jargon. Every answer backed by on-chain evidence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/tx"
          className="block rounded-2xl p-8 border transition-all duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="text-3xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Tx Translator</h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            Paste a tx hash. We&apos;ll unpack what happened — with receipts to
            prove it.
          </p>
          <div
            className="mt-6 text-sm font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            Translate a transaction →
          </div>
        </Link>

        <Link
          href="/approvals"
          className="block rounded-2xl p-8 border transition-all duration-200 hover:scale-[1.02] focus:outline-none focus-visible:ring-2"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="text-3xl mb-4">🛡️</div>
          <h2 className="text-xl font-semibold mb-2">Approval Check</h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            See which contracts can move your tokens — especially unlimited
            approvals.
          </p>
          <div
            className="mt-6 text-sm font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            Check approvals →
          </div>
        </Link>
      </div>

      <footer
        className="text-xs text-center max-w-md"
        style={{ color: 'var(--color-muted)' }}
      >
        Interpretation is educational, not financial or legal advice. Verify
        on-chain evidence before acting.
      </footer>
    </main>
  )
}
