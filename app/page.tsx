export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '64px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#67e8f9' }}>OperatorOS Studio</p>
        <h1 style={{ marginTop: 16, maxWidth: 860, fontSize: 'clamp(44px, 7vw, 72px)', lineHeight: 1.05 }}>
          Your landing page, built by an AI operator.
        </h1>
        <p style={{ marginTop: 24, maxWidth: 760, color: '#d4d4d8', fontSize: 20, lineHeight: 1.6 }}>
          OperatorOS Studio turns a founder brief into a quoted project, a generated draft, a tracked revision loop, and a final delivery workflow with approvals and replay built in.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28 }}>
          <a href="/brief" style={{ borderRadius: 16, background: '#67e8f9', color: '#111827', fontWeight: 700, padding: '14px 20px', textDecoration: 'none' }}>Start a project</a>
          <a href="/pricing" style={{ borderRadius: 16, border: '1px solid #3f3f46', color: '#f4f4f5', fontWeight: 700, padding: '14px 20px', textDecoration: 'none' }}>See pricing</a>
        </div>

        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginTop: 56 }}>
          {[
            ['1. Intake', 'Capture the brief, score complexity, and generate a bounded quote.'],
            ['2. Draft', 'Generate the first landing page draft immediately and make it previewable.'],
            ['3. Operate', 'Track revisions, payment state, approvals, and final delivery in one place.'],
          ].map(([title, body]) => (
            <div key={title} style={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 24, padding: 24 }}>
              <h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
              <p style={{ marginTop: 12, color: '#d4d4d8', lineHeight: 1.6 }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, background: '#18181b', border: '1px solid #3f3f46', borderRadius: 28, padding: 28 }}>
          <h2 style={{ margin: 0, fontSize: 32 }}>This is a real operator loop, not a fake mockup.</h2>
          <p style={{ marginTop: 16, color: '#d4d4d8', maxWidth: 800, lineHeight: 1.7 }}>
            The app now stores real project records on the server, produces real draft pages, records actions for replay, and blocks risky deliveries behind an approval queue. Humans are still only there for guardrails.
          </p>
        </div>
      </div>
    </main>
  )
}
