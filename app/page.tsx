export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">OperatorOS Studio</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-tight">
          Your landing page, built by an AI operator.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          OperatorOS Studio turns your brief into a real launch page fast — quote, draft, revisions, and delivery handled by an AI-run workflow with human guardrails.
        </p>
        <div className="mt-8 flex gap-4">
          <a href="/brief" className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-zinc-950">Get your page</a>
          <a href="/pricing" className="rounded-2xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-100">See pricing</a>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            ['Send the brief', 'Tell us what you are launching, who it is for, and what action the page should drive.'],
            ['Get a quote', 'The operator returns the best-fit package inside fixed pricing rules.'],
            ['Receive your draft', 'The system generates the first landing page draft and handles revisions.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-zinc-400">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8">
          <h2 className="text-2xl font-semibold">Yes — the operator is really AI-run.</h2>
          <p className="mt-4 max-w-3xl text-zinc-400">
            The AI handles quoting, draft generation, revision processing, and delivery workflows. Humans are there for guardrails, approvals on risky actions, and emergency intervention — not hidden production work.
          </p>
        </div>
      </div>
    </main>
  )
}
