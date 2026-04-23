'use client'

import { useState } from 'react'

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
  const style = {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #3f3f46',
    background: '#09090b',
    color: '#f4f4f5',
    padding: '14px 16px',
    font: 'inherit',
  }

  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#e4e4e7' }}>{label}</span>
      {textarea ? (
        <textarea required={required} name={name} style={{ ...style, minHeight: 120 }} />
      ) : (
        <input required={required} name={name} style={style} />
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
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '64px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <p style={{ marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#67e8f9' }}>OperatorOS Studio</p>
        <h1 style={{ fontSize: 'clamp(38px, 6vw, 60px)', margin: 0 }}>Tell the operator what you need.</h1>
        <p style={{ marginTop: 18, maxWidth: 700, color: '#d4d4d8', lineHeight: 1.7 }}>
          Submit a brief and the system will create a real project record, produce a bounded quote, and generate the first landing page draft immediately.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 32, display: 'grid', gap: 20, borderRadius: 28, border: '1px solid #3f3f46', background: '#18181b', padding: 24 }}>
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <Field label="Your name" name="name" />
            <Field label="Email" name="email" />
          </div>
          <Field label="Company or project" name="company" required={false} />
          <Field label="What are you launching?" name="offerSummary" textarea />
          <Field label="Who is it for?" name="targetAudience" />
          <Field label="What action should the visitor take?" name="primaryGoal" />
          <Field label="Which package sounds closest?" name="packageHint" required={false} />
          <button disabled={loading} style={{ borderRadius: 18, background: '#67e8f9', color: '#111827', fontWeight: 700, border: 0, padding: '14px 20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Generating quote…' : 'Generate my quote'}
          </button>
        </form>

        {error ? (
          <div style={{ marginTop: 24, borderRadius: 18, border: '1px solid rgba(244,63,94,0.35)', background: 'rgba(244,63,94,0.12)', padding: 18, color: '#fecdd3' }}>{error}</div>
        ) : null}

        {result ? (
          <div style={{ marginTop: 24, borderRadius: 28, border: '1px solid rgba(103,232,249,0.35)', background: 'rgba(103,232,249,0.12)', padding: 24 }}>
            <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#a5f3fc' }}>Quote result {result.mode ? `(${result.mode})` : ''}</p>
            {result.quote.status === 'ok' ? (
              <>
                <h2 style={{ marginTop: 10, marginBottom: 0, fontSize: 30 }}>{result.quote.packageType} — £{result.quote.price}</h2>
                <p style={{ marginTop: 12, color: '#ecfeff', lineHeight: 1.6 }}>{result.quote.reason}</p>
                <p style={{ marginTop: 12, color: '#d4d4d8' }}>Project ID: {result.projectId}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  {result.projectUrl ? (
                    <a href={result.projectUrl} style={{ borderRadius: 16, background: '#67e8f9', color: '#111827', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Open project portal</a>
                  ) : null}
                  {result.previewUrl ? (
                    <a href={result.previewUrl} style={{ borderRadius: 16, border: '1px solid #67e8f9', color: '#ecfeff', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Preview draft</a>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 10, marginBottom: 0, fontSize: 30 }}>Needs escalation</h2>
                <p style={{ marginTop: 12, color: '#ecfeff', lineHeight: 1.6 }}>{result.quote.reason}</p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
