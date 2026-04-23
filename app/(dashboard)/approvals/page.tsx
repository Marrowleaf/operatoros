export const dynamic = 'force-dynamic'

import { getApprovals } from '@/src/lib/store'

export default async function ApprovalsPage() {
  const approvals = await getApprovals('all')

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '56px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Operator controls</p>
        <h1 style={{ marginTop: 10, fontSize: 'clamp(34px, 6vw, 54px)' }}>Approvals</h1>
        <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>
          {approvals.map((approval) => (
            <div key={approval.id} style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22 }}>{approval.actionType}</h2>
                  <p style={{ marginTop: 8, color: '#d4d4d8', lineHeight: 1.6 }}>{approval.reason}</p>
                  <p style={{ marginTop: 8, color: '#a1a1aa' }}>Status: {approval.status}</p>
                </div>
                {approval.projectId ? <a href={`/projects/${approval.projectId}`} style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 700 }}>Open project</a> : null}
              </div>

              {approval.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                  <form method="post" action={`/api/approvals/${approval.id}`}>
                    <input type="hidden" name="status" value="approved" />
                    <input type="hidden" name="redirectTo" value="/approvals" />
                    <button style={{ borderRadius: 16, border: 0, background: '#67e8f9', color: '#111827', padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>Approve</button>
                  </form>
                  <form method="post" action={`/api/approvals/${approval.id}`}>
                    <input type="hidden" name="status" value="rejected" />
                    <input type="hidden" name="redirectTo" value="/approvals" />
                    <button style={{ borderRadius: 16, border: '1px solid #52525b', background: 'transparent', color: '#f4f4f5', padding: '12px 16px', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
          {approvals.length === 0 ? <p style={{ color: '#a1a1aa' }}>No approvals yet.</p> : null}
        </div>
      </div>
    </main>
  )
}
