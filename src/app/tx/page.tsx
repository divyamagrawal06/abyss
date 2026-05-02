export default function TxPage() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-2">Tx Translator</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        Paste a Mantle transaction hash. We&apos;ll unpack what happened.
      </p>
      {/* M1: form + result panel goes here */}
      <div
        className="w-full rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-muted)',
        }}
      >
        Coming soon — M1
      </div>
    </main>
  )
}
