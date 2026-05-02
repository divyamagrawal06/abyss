export default function ApprovalsPage() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 max-w-3xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Approval Check</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        Connect your wallet to see which contracts can spend your tokens.
      </p>
      {/* M2: connect button + approval table goes here */}
      <div
        className="w-full rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        Coming soon — M2
      </div>
    </main>
  )
}
