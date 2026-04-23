export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { getDefaultOperatorPath, getOwnerPageSession } from '@/src/lib/owner-page-auth'
import { getSafeRedirectPath } from '@/src/lib/request-auth'

export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  const redirectTo = getSafeRedirectPath(params.next) ?? '/projects'
  const session = await getOwnerPageSession()

  if (session) {
    const allowedNext =
      session.role === 'owner'
        ? true
        : session.role === 'operator'
          ? redirectTo.startsWith('/projects') || redirectTo.startsWith('/runs')
          : redirectTo.startsWith('/approvals')

    redirect(allowedNext ? redirectTo : getDefaultOperatorPath(session.role))
  }

  const showError = params.error === 'invalid'

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#09090b',
        color: '#f4f4f5',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 460,
          borderRadius: 28,
          border: '1px solid #27272a',
          background: '#18181b',
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Operator access</p>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 46px)', marginTop: 12, marginBottom: 10 }}>Sign in</h1>
        <p style={{ color: '#d4d4d8', lineHeight: 1.7, marginTop: 0 }}>
          Sign in with an operator account to manage projects, approvals, and delivery decisions.
        </p>

        <form method="post" action="/api/owner/login" style={{ display: 'grid', gap: 14, marginTop: 20 }}>
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Username</span>
            <input
              type="text"
              name="username"
              required
              autoFocus
              defaultValue="operatoros"
              placeholder="operatoros"
              style={{
                borderRadius: 16,
                border: '1px solid #3f3f46',
                background: '#09090b',
                color: '#f4f4f5',
                padding: '14px 16px',
                font: 'inherit',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Password</span>
            <input
              type="password"
              name="password"
              required
              placeholder="Enter account password"
              style={{
                borderRadius: 16,
                border: '1px solid #3f3f46',
                background: '#09090b',
                color: '#f4f4f5',
                padding: '14px 16px',
                font: 'inherit',
              }}
            />
          </label>
          {showError ? <p style={{ margin: 0, color: '#fda4af' }}>Invalid username or password. Try again.</p> : null}
          <button
            style={{
              borderRadius: 16,
              border: 0,
              background: '#67e8f9',
              color: '#111827',
              fontWeight: 800,
              padding: '14px 18px',
              cursor: 'pointer',
            }}
          >
            Open dashboard
          </button>
        </form>
      </section>
    </main>
  )
}
