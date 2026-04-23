export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getPublicProjectById } from '@/src/lib/store'

export default async function PublicProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams
  const project = await getPublicProjectById(id, token ?? '')

  if (!project) {
    notFound()
  }

  const quote = project.memory.quote
  const paymentInstructions = project.memory.paymentInstructions
  const publicPreviewHref = project.memory.draft ? `/preview/${project.id}?token=${project.publicToken}` : null
  const publicActionHref = `/api/public/projects/${project.id}/actions`

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '56px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Project portal</p>
        <h1 style={{ marginTop: 12, marginBottom: 0, fontSize: 'clamp(34px, 6vw, 54px)' }}>{project.customer?.name ?? 'OperatorOS project'}</h1>
        <p style={{ marginTop: 12, color: '#d4d4d8', lineHeight: 1.7 }}>
          Status: <strong style={{ color: '#f4f4f5' }}>{project.status}</strong>
        </p>

        <section style={{ marginTop: 24, border: '1px solid #3f3f46', borderRadius: 24, padding: 24, background: '#18181b' }}>
          <h2 style={{ marginTop: 0 }}>Quote</h2>
          {quote.status === 'ok' ? (
            <>
              <p style={{ color: '#d4d4d8', lineHeight: 1.7 }}>
                Package: <strong style={{ color: '#f4f4f5' }}>{project.packageType}</strong> — £{quote.price}
              </p>
              <p style={{ color: '#d4d4d8', lineHeight: 1.7 }}>{quote.reason}</p>
            </>
          ) : (
            <p style={{ color: '#d4d4d8', lineHeight: 1.7 }}>{quote.reason}</p>
          )}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 }}>
            {publicPreviewHref ? (
              <a href={publicPreviewHref} style={{ borderRadius: 16, background: '#67e8f9', color: '#111827', padding: '12px 16px', fontWeight: 700, textDecoration: 'none' }}>Open preview</a>
            ) : null}
          </div>
        </section>

        <section style={{ marginTop: 24, border: '1px solid #3f3f46', borderRadius: 24, padding: 24, background: '#18181b' }}>
          <h2 style={{ marginTop: 0 }}>Move the project forward</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <form method="post" action={publicActionHref} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input type="hidden" name="action" value="request_payment" />
              <input type="hidden" name="redirectTo" value={`/project/${project.id}?token=${project.publicToken}`} />
              <input type="hidden" name="token" value={project.publicToken} />
              <button style={{ borderRadius: 16, border: 0, background: '#67e8f9', color: '#111827', padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>Request payment instructions</button>
            </form>
            {paymentInstructions ? <p style={{ margin: 0, color: '#d4d4d8', lineHeight: 1.7 }}>{paymentInstructions}</p> : null}

            <form method="post" action={publicActionHref} style={{ display: 'grid', gap: 10 }}>
              <input type="hidden" name="action" value="request_revision" />
              <input type="hidden" name="redirectTo" value={`/project/${project.id}?token=${project.publicToken}`} />
              <input type="hidden" name="token" value={project.publicToken} />
              <textarea name="note" required placeholder="What should change in the draft?" style={{ minHeight: 110, borderRadius: 16, border: '1px solid #3f3f46', background: '#09090b', color: '#f4f4f5', padding: 14, font: 'inherit' }} />
              <button style={{ width: 'fit-content', borderRadius: 16, border: '1px solid #3f3f46', background: 'transparent', color: '#f4f4f5', padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>Request revision</button>
            </form>
          </div>
        </section>

        {project.memory.revisions.length ? (
          <section style={{ marginTop: 24, border: '1px solid #3f3f46', borderRadius: 24, padding: 24, background: '#18181b' }}>
            <h2 style={{ marginTop: 0 }}>Revision history</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {project.memory.revisions.slice().reverse().map((revision) => (
                <div key={revision.id} style={{ borderRadius: 18, background: '#09090b', padding: 16, border: '1px solid #27272a' }}>
                  <p style={{ margin: 0, color: '#f4f4f5' }}>{revision.note}</p>
                  <p style={{ marginTop: 8, marginBottom: 0, color: '#a1a1aa', fontSize: 14 }}>{new Date(revision.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
