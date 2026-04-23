export const dynamic = 'force-dynamic'

import { getProjects } from '@/src/lib/store'
import { requireOwnerPage } from '@/src/lib/owner-page-auth'

export default async function ProjectsPage() {
  await requireOwnerPage('/projects')
  const projects = await getProjects()

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', padding: '56px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Owner dashboard</p>
            <h1 style={{ fontSize: 'clamp(34px, 6vw, 54px)', margin: '10px 0 0' }}>Projects</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/brief" style={{ borderRadius: 16, background: '#67e8f9', color: '#111827', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Create new project</a>
            <form method="post" action="/api/owner/logout">
              <input type="hidden" name="redirectTo" value="/owner/login" />
              <button style={{ borderRadius: 16, border: '1px solid #3f3f46', background: 'transparent', color: '#f4f4f5', fontWeight: 700, padding: '12px 16px', cursor: 'pointer' }}>Log out</button>
            </form>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, marginTop: 28 }}>
          {projects.map((project) => {
            const publicProjectHref = `/project/${project.id}?token=${project.publicToken}`
            const publicPreviewHref = `/preview/${project.id}?token=${project.publicToken}`

            return (
              <div key={project.id} style={{ borderRadius: 24, border: '1px solid #3f3f46', background: '#18181b', padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22 }}>{project.customer?.name ?? 'Unknown customer'}</h2>
                    <p style={{ marginTop: 8, marginBottom: 0, color: '#d4d4d8' }}>{project.customer?.email ?? 'No email'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#d4d4d8' }}>Status: {project.status}</div>
                    <div style={{ color: '#d4d4d8' }}>Quote: {project.quotedPrice ? `£${project.quotedPrice}` : '—'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <a href={`/projects/${project.id}`} style={{ borderRadius: 16, background: '#67e8f9', color: '#111827', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Open workspace</a>
                  <a href={publicProjectHref} style={{ borderRadius: 16, border: '1px solid #3f3f46', color: '#f4f4f5', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Customer portal</a>
                  {project.memory.draft ? (
                    <a href={publicPreviewHref} style={{ borderRadius: 16, border: '1px solid #3f3f46', color: '#f4f4f5', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Preview</a>
                  ) : null}
                  <a href={`/runs/${project.id}`} style={{ borderRadius: 16, border: '1px solid #3f3f46', color: '#f4f4f5', fontWeight: 700, padding: '12px 16px', textDecoration: 'none' }}>Replay</a>
                </div>
              </div>
            )
          })}
          {projects.length === 0 ? <p style={{ color: '#a1a1aa' }}>No projects yet.</p> : null}
        </div>
      </div>
    </main>
  )
}
