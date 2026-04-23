export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

import { getPaymentSessionById, getProjectById, getPublicProjectById } from '@/src/lib/store'

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; status?: string }>
}) {
  const { id } = await params
  const { token, status } = await searchParams
  const session = await getPaymentSessionById(id)

  if (!session) {
    notFound()
  }

  if (session.provider === 'stripe') {
    const project = await getProjectById(session.projectId)
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#09090b', color: '#f4f4f5', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <section style={{ width: '100%', maxWidth: 680, borderRadius: 28, border: '1px solid #27272a', background: '#18181b', padding: 28 }}>
          <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Stripe checkout</p>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 46px)', marginTop: 12 }}>
            {status === 'success' ? 'Payment received' : status === 'cancelled' ? 'Checkout cancelled' : 'Complete secure checkout'}
          </h1>
          <p style={{ color: '#d4d4d8', lineHeight: 1.7 }}>
            {status === 'success'
              ? 'Your payment was confirmed successfully.'
              : status === 'cancelled'
                ? 'You can reopen checkout any time from your project portal.'
                : 'Use the secure Stripe link below to complete payment.'}
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 20, color: '#d4d4d8' }}>
            <div>Reference: <strong style={{ color: '#f4f4f5' }}>{session.reference}</strong></div>
            <div>Amount: <strong style={{ color: '#f4f4f5' }}>£{session.amount}</strong></div>
            <div>Status: <strong style={{ color: '#f4f4f5' }}>{session.status}</strong></div>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {status !== 'success' ? <a href={session.checkoutUrl} style={{ borderRadius: 16, background: '#67e8f9', color: '#111827', padding: '12px 16px', fontWeight: 800, textDecoration: 'none' }}>Open Stripe checkout</a> : null}
            {project ? <a href="/owner/login" style={{ borderRadius: 16, border: '1px solid #3f3f46', color: '#f4f4f5', padding: '12px 16px', fontWeight: 700, textDecoration: 'none' }}>Operator login</a> : null}
          </div>
        </section>
      </main>
    )
  }

  const project = await getPublicProjectById(session.projectId, token ?? '')
  if (!project) {
    notFound()
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#09090b', color: '#f4f4f5', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: 680, borderRadius: 28, border: '1px solid #27272a', background: '#18181b', padding: 28 }}>
        <p style={{ color: '#67e8f9', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.24em' }}>Sandbox checkout</p>
        <h1 style={{ fontSize: 'clamp(32px, 6vw, 46px)', marginTop: 12 }}>Pay for {project.customer?.name ?? 'your project'}</h1>
        <p style={{ color: '#d4d4d8', lineHeight: 1.7 }}>This server is ready for real Stripe checkout when keys are configured. For now, this sandbox flow marks the quoted amount as paid and advances the job automatically.</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 20, color: '#d4d4d8' }}>
          <div>Reference: <strong style={{ color: '#f4f4f5' }}>{session.reference}</strong></div>
          <div>Amount: <strong style={{ color: '#f4f4f5' }}>£{session.amount}</strong></div>
          <div>Status: <strong style={{ color: '#f4f4f5' }}>{session.status}</strong></div>
        </div>
        <form method="post" action={`/api/payments/checkout/${session.id}`} style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input type="hidden" name="token" value={project.publicToken} />
          <input type="hidden" name="redirectTo" value={`/project/${project.id}?token=${project.publicToken}`} />
          <button style={{ borderRadius: 16, border: 0, background: '#67e8f9', color: '#111827', padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>Complete sandbox payment</button>
          <a href={`/project/${project.id}?token=${project.publicToken}`} style={{ borderRadius: 16, border: '1px solid #3f3f46', color: '#f4f4f5', padding: '12px 16px', fontWeight: 700, textDecoration: 'none' }}>Back to project</a>
        </form>
      </section>
    </main>
  )
}
