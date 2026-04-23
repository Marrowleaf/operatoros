export const dynamic = 'force-dynamic'

import { getProjectById } from '@/src/lib/store'
import { requireOwnerPage } from '@/src/lib/owner-page-auth'
import { notFound } from 'next/navigation'

function actionButton() {
  return {
    borderRadius: 16,
    border: '1px solid #3f3f46',
    background: 'transparent',
    color: '#f4f4f5',
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  } as const
}

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireOwnerPage(`/projects/${id}`, ['owner', 'operator'])
  const project = await getProjectById(id)

  if (!project) {
    notFound()
  }

  const publicProjectHref = `/project/${project.id}?token=${project.publicToken}`
  const publicPreviewHref = `/preview/${project.id}?token=${project.publicToken}`

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '56px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 24 }}>
        <section style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 24 }}>
          <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Project workspace</p>
          <h1 style={{ marginTop: 10, marginBottom: 0, fontSize: 'clamp(34px, 6vw, 54px)' }}>{project.customer?.name ?? 'Unknown customer'}</h1>
          <p style={{ marginTop: 12, color: '#d4d4d8' }}>{project.customer?.email ?? 'No email'} · Status: {project.status}</p>
          <p style={{ marginTop: 8, color: '#a1a1aa' }}>Signed in as {session.username} · {session.role}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <a href={publicProjectHref} style={{ ...actionButton(), textDecoration: 'none', display: 'inline-block' }}>Open customer portal</a>
            {project.memory.draft ? <a href={publicPreviewHref} style={{ ...actionButton(), textDecoration: 'none', display: 'inline-block' }}>Open preview</a> : null}
            <a href={`/runs/${project.id}`} style={{ ...actionButton(), textDecoration: 'none', display: 'inline-block' }}>Replay</a>
            <form method="post" action="/api/owner/logout">
              <input type="hidden" name="redirectTo" value="/owner/login" />
              <button style={actionButton()}>Log out</button>
            </form>
          </div>
        </section>

        {session.role !== 'reviewer' ? (
        <section style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Owner actions</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <form method="post" action={`/api/projects/${project.id}/actions`}>
              <input type="hidden" name="action" value="request_payment" />
              <input type="hidden" name="redirectTo" value={`/projects/${project.id}`} />
              <button style={actionButton()}>Request payment</button>
            </form>
            <form method="post" action={`/api/projects/${project.id}/actions`}>
              <input type="hidden" name="action" value="mark_paid" />
              <input type="hidden" name="redirectTo" value={`/projects/${project.id}`} />
              <button style={actionButton()}>Mark paid</button>
            </form>
            <form method="post" action={`/api/projects/${project.id}/actions`}>
              <input type="hidden" name="action" value="request_delivery" />
              <input type="hidden" name="redirectTo" value={`/projects/${project.id}`} />
              <button style={{ borderRadius: 16, border: 0, background: '#67e8f9', color: '#111827', padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>Deliver / request approval</button>
            </form>
          </div>

          <form method="post" action={`/api/projects/${project.id}/actions`} style={{ display: 'grid', gap: 10, marginTop: 20 }}>
            <input type="hidden" name="action" value="regenerate_draft" />
            <input type="hidden" name="redirectTo" value={`/projects/${project.id}`} />
            <textarea name="note" placeholder="Optional note for the next draft pass" style={{ minHeight: 110, borderRadius: 16, border: '1px solid #3f3f46', background: '#09090b', color: '#f4f4f5', padding: 14, font: 'inherit' }} />
            <button style={{ ...actionButton(), width: 'fit-content' }}>Regenerate draft</button>
          </form>
        </section>
        ) : null}

        <section style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>Brief + draft summary</h2>
          <div style={{ display: 'grid', gap: 12, color: '#d4d4d8', lineHeight: 1.7 }}>
            <div><strong style={{ color: '#f4f4f5' }}>Offer:</strong> {project.memory.brief.offerSummary}</div>
            <div><strong style={{ color: '#f4f4f5' }}>Audience:</strong> {project.memory.brief.targetAudience}</div>
            <div><strong style={{ color: '#f4f4f5' }}>Primary goal:</strong> {project.memory.brief.primaryGoal}</div>
            <div><strong style={{ color: '#f4f4f5' }}>Last draft generated:</strong> {project.memory.draft ? new Date(project.memory.draft.generatedAt).toLocaleString() : 'No draft yet'}</div>
          </div>
        </section>

        {project.approvals.length ? (
          <section style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 24 }}>
            <h2 style={{ marginTop: 0 }}>Approvals</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {project.approvals.map((approval) => (
                <div key={approval.id} style={{ borderRadius: 18, border: '1px solid #27272a', background: '#09090b', padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{approval.actionType}</p>
                  <p style={{ marginTop: 8, color: '#d4d4d8', lineHeight: 1.6 }}>{approval.reason}</p>
                  <p style={{ marginTop: 8, color: '#a1a1aa' }}>Status: {approval.status}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
