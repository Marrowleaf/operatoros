'use client'

import Link from 'next/link'
import { useState } from 'react'

import { SiteShell } from '@/components/site-shell'

type QuoteResponse = {
  projectId: string
  quote:
    | { status: 'ok'; packageType: string; price: number; reason: string }
    | { status: 'escalate'; reason: string }
  mode?: 'persistent-file'
  projectUrl?: string
  previewUrl?: string
}

function Field({
  label,
  name,
  textarea = false,
  required = true,
}: {
  label: string
  name: string
  textarea?: boolean
  required?: boolean
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {textarea ? <textarea id={name} required={required} name={name} /> : <input id={name} required={required} name={name} />}
    </div>
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
    <SiteShell>
      <section className="hero">
        <div className="grid-2">
          <div>
            <p className="eyebrow">Start a project</p>
            <h1 className="page-title">Tell the operator what you need.</h1>
            <p className="page-copy">
              Submit a brief and the system will create a real project record, generate a bounded quote, and produce the first landing page draft immediately.
            </p>
            <ul className="feature-list">
              <li>Brief gets stored as a real project, not a dead lead form</li>
              <li>Quote stays inside policy bands or escalates cleanly</li>
              <li>Client portal and preview links are generated when available</li>
            </ul>
          </div>

          <aside className="info-block">
            <p className="section-label">What to include</p>
            <h2 className="info-title">The clearer the brief, the better the first draft.</h2>
            <p className="info-copy">
              Focus on the offer, target audience, and the one action you want a visitor to take. That is enough for the operator to quote and draft safely.
            </p>
          </aside>
        </div>
      </section>

      <section className="section">
        <form onSubmit={onSubmit} className="form-shell field-grid">
          <div className="field-grid field-grid--2">
            <Field label="Your name" name="name" />
            <Field label="Email" name="email" />
          </div>
          <Field label="Company or project" name="company" required={false} />
          <Field label="What are you launching?" name="offerSummary" textarea />
          <div className="field-grid field-grid--2">
            <Field label="Who is it for?" name="targetAudience" />
            <Field label="What action should the visitor take?" name="primaryGoal" />
          </div>
          <Field label="Which package sounds closest?" name="packageHint" required={false} />
          <div className="button-row">
            <button disabled={loading} className="button" type="submit">
              {loading ? 'Generating quote…' : 'Generate my quote'}
            </button>
            <Link href="/pricing" className="button-ghost">
              Review packages
            </Link>
          </div>
        </form>

        {error ? <div className="result-card result-card--error">{error}</div> : null}

        {result ? (
          <div className="result-card">
            <p className="section-label">Quote result {result.mode ? `(${result.mode})` : ''}</p>
            {result.quote.status === 'ok' ? (
              <>
                <h2 className="result-title">
                  {result.quote.packageType} — £{result.quote.price}
                </h2>
                <p className="page-copy">{result.quote.reason}</p>
                <div className="portal-meta">
                  <span className="status-badge">Project ID: {result.projectId}</span>
                </div>
                <div className="button-row">
                  {result.projectUrl ? (
                    <a href={result.projectUrl} className="button">
                      Open project portal
                    </a>
                  ) : null}
                  {result.previewUrl ? (
                    <a href={result.previewUrl} className="button-secondary">
                      Preview draft
                    </a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <h2 className="result-title">Needs escalation</h2>
                <p className="page-copy">{result.quote.reason}</p>
              </>
            )}
          </div>
        ) : null}
      </section>
    </SiteShell>
  )
}
