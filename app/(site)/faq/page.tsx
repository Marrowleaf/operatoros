const faqs = [
  ['Is this actually AI-run?', 'Yes. The workflow is intentionally AI-operated, with humans only handling guardrails and exceptional cases.'],
  ['Is there hidden human labour doing the work?', 'Not as the default workflow. The point is to prove a real AI-run internet business can operate visibly.'],
  ['What if the request is too custom?', 'The operator escalates instead of inventing random promises or pricing.'],
]

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-semibold">FAQ</h1>
        <div className="mt-10 grid gap-6">
          {faqs.map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-xl font-semibold">{q}</h2>
              <p className="mt-3 text-zinc-400">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
