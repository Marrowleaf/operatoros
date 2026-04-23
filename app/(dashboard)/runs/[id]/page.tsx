export const dynamic = 'force-dynamic'

import { getActionsForProject, getProjectById } from '@/src/lib/store'
import { requireOwnerPage } from '@/src/lib/owner-page-auth'

export default async function RunReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireOwnerPage(`/runs/${id}`)
  const project = await getProjectById(id)
  const actions = await getActionsForProject(id)

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '56px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em', margin: 0 }}>Replay</p>
          <form method="post" action="/api/owner/logout">
            <input type="hidden" name="redirectTo" value="/owner/login" />
            <button style={{ borderRadius: 16, border: '1px solid #3f3f46', background: 'transparent', color: '#f4f4f5', fontWeight: 700, padding: '12px 16px', cursor: 'pointer' }}>Log out</button>
          </form>
        </div>
        <h1 style={{ marginTop: 10, fontSize: 'clamp(34px, 6vw, 54px)' }}>Project run history</h1>
        {project ? <p style={{ color: '#d4d4d8' }}>Project {project.id} · {project.customer?.email ?? 'Unknown customer'}</p> : null}

        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          {actions.map((action) => (
            <div key={action.id} style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <strong>{action.type}</strong>
                <span style={{ color: '#a1a1aa', textTransform: 'uppercase', fontSize: 12 }}>{action.status} · {action.riskLevel}</span>
              </div>
              <pre style={{ overflowX: 'auto', borderRadius: 16, background: '#09090b', padding: 16, color: '#d4d4d8', marginTop: 16, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify({ input: action.input, output: action.output, reason: action.reason, createdAt: action.createdAt }, null, 2)}
              </pre>
            </div>
          ))}
          {actions.length === 0 ? <p style={{ color: '#a1a1aa' }}>No actions recorded for this project yet.</p> : null}
        </div>
      </div>
    </main>
  )
}
