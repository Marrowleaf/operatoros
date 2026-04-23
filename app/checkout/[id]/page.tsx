export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

import { SiteShell } from '@/components/site-shell'
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
      <SiteShell compact>
        <section className="hero">
          <article className="portal-card">
            <p className="eyebrow">Stripe checkout</p>
            <h1 className="page-title">
              {status === 'success' ? 'Payment received' : status === 'cancelled' ? 'Checkout cancelled' : 'Complete secure checkout'}
            </h1>
            <p className="page-copy">
              {status === 'success'
                ? 'Your payment was confirmed successfully.'
                : status === 'cancelled'
                  ? 'You can reopen checkout any time from your project portal.'
                  : 'Use the secure Stripe link below to complete payment.'}
            </p>
            <div className="portal-meta">
              <span className="status-badge">Reference: {session.reference}</span>
              <span className="status-badge">Amount: £{session.amount}</span>
              <span className="status-badge">Status: {session.status}</span>
            </div>
            <div className="button-row">
              {status !== 'success' ? (
                <a href={session.checkoutUrl} className="button">
                  Open Stripe checkout
                </a>
              ) : null}
              {project ? (
                <a href="/owner/login" className="button-ghost">
                  Operator login
                </a>
              ) : null}
            </div>
          </article>
        </section>
      </SiteShell>
    )
  }

  const project = await getPublicProjectById(session.projectId, token ?? '')
  if (!project) {
    notFound()
  }

  return (
    <SiteShell compact>
      <section className="hero">
        <article className="portal-card">
          <p className="eyebrow">Sandbox checkout</p>
          <h1 className="page-title">Pay for {project.customer?.name ?? 'your project'}</h1>
          <p className="page-copy">
            This server is ready for real Stripe checkout when keys are configured. For now, this sandbox flow marks the quoted amount as paid and advances the job automatically.
          </p>
          <div className="portal-meta">
            <span className="status-badge">Reference: {session.reference}</span>
            <span className="status-badge">Amount: £{session.amount}</span>
            <span className="status-badge">Status: {session.status}</span>
          </div>
          <form method="post" action={`/api/payments/checkout/${session.id}`} className="button-row">
            <input type="hidden" name="token" value={project.publicToken} />
            <input type="hidden" name="redirectTo" value={`/project/${project.id}?token=${project.publicToken}`} />
            <button className="button" type="submit">
              Complete sandbox payment
            </button>
            <a href={`/project/${project.id}?token=${project.publicToken}`} className="button-ghost">
              Back to project
            </a>
          </form>
        </article>
      </section>
    </SiteShell>
  )
}
