'use client'

import { useState } from 'react'

type QuoteResponse = {
  projectId: string
  quote:
    | { status: 'ok'; packageType: string; price: number; reason: string }
    | { status: 'escalate'; reason: string }
  mode?: 'demo' | 'database'
}

function Field({ label, name, textarea = false, required = true }: { label: string; name: string; textarea?: boolean; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      {textarea ? (
        <textarea required={required} name={name} className="min-h-28 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100" />
      ) : (
        <input required={required} name={name} className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100" />
      )}
    </label>
  )
}

export default function BriefPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await response.json()

    if (!response.ok) {
      setError(json?.error ?? 'Something went wrong generating the quote.')
      setLoading(false)
      return
    }

    setResult(json)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-300">OperatorOS Studio</p>
        <h1 className="text-4xl font-semibold">Tell the operator what you need.</h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Give a clear brief and the system will generate the best-fit quote and create the project workspace.
        </p>

        <form onSubmit={onSubmit} className="mt-10 grid gap-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Your name" name="name" />
            <Field label="Email" name="email" />
          </div>
          <Field label="Company or project" name="company" required={false} />
          <Field label="What are you launching?" name="offerSummary" textarea />
          <Field label="Who is it for?" name="targetAudience" />
          <Field label="What action should the visitor take?" name="primaryGoal" />
          <Field label="Which package sounds closest?" name="packageHint" required={false} />
          <button disabled={loading} className="rounded-2xl bg-cyan-300 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-60">
            {loading ? 'Generating quote…' : 'Generate my quote'}
          </button>
        </form>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">{error}</div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Quote result {result.mode === 'demo' ? '(demo mode)' : ''}</p>
            {result.quote.status === 'ok' ? (
              <>
                <h2 className="mt-2 text-2xl font-semibold">{result.quote.packageType} — £{result.quote.price}</h2>
                <p className="mt-3 text-zinc-200">{result.quote.reason}</p>
                <p className="mt-4 text-sm text-zinc-300">Project ID: {result.projectId}</p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-2xl font-semibold">Needs escalation</h2>
                <p className="mt-3 text-zinc-200">{result.quote.reason}</p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
