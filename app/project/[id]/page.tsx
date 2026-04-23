export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'

import { SiteShell } from '@/components/site-shell'
import { getPublicProjectById } from '@/src/lib/store'

function getStatusClass(status: string) {
  if (status === 'delivered' || status === 'in_progress') {
    return 'status-badge status-badge--success'
  }

  if (status === 'escalated') {
    return 'status-badge status-badge--danger'
  }

  return 'status-badge status-badge--warning'
}

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
  const latestPaymentSession = project.paymentSessions[0] ?? null
  const paymentsAvailable =
    (Boolean(process.env.STRIPE_SECRET_KEY?.trim()) || process.env.OPERATOROS_ALLOW_SANDBOX_PAYMENTS === '1') &&
    (project.paidAmount ?? 0) < (project.quotedPrice ?? 0) &&
    project.status !== 'in_progress' &&
    project.status !== 'delivered'

  return (
    <SiteShell compact>
      <section className="hero">
        <div className="portal-header">
          <div>
            <p className="eyebrow">Project portal</p>
            <h1 className="page-title">{project.customer?.name ?? 'OperatorOS project'}</h1>
            <p className="page-copy">Use this page to review the quote, open the preview, request changes, and move the project forward.</p>
          </div>
          <div className="portal-meta">
            <span className={getStatusClass(project.status)}>Status: {project.status}</span>
            {project.packageType ? <span className="status-badge">Package: {project.packageType}</span> : null}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="portal-grid">
          <article className="portal-card">
            <p className="section-label">Quote</p>
            <h2 className="info-title">Project scope and price</h2>
            {quote.status === 'ok' ? (
              <>
                <p className="info-copy">
                  Package: <strong>{project.packageType}</strong> — £{quote.price}
                </p>
                <p className="info-copy">{quote.reason}</p>
              </>
            ) : (
              <p className="info-copy">{quote.reason}</p>
            )}
            <div className="button-row">
              {publicPreviewHref ? (
                <a href={publicPreviewHref} className="button">
                  Open preview
                </a>
              ) : null}
            </div>
          </article>

          <article className="portal-card">
            <p className="section-label">Payment</p>
            <h2 className="info-title">Move the project into production.</h2>
            {paymentsAvailable ? (
              <form method="post" action="/api/payments/create-link" className="field-grid">
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="redirectTo" value={`/project/${project.id}?token=${project.publicToken}`} />
                <input type="hidden" name="token" value={project.publicToken} />
                <button className="button" type="submit">
                  Open checkout
                </button>
              </form>
            ) : project.paidAmount >= (project.quotedPrice ?? 0) ? (
              <p className="info-copy" style={{ color: 'var(--success)' }}>
                Payment is already recorded for this project.
              </p>
            ) : (
              <p className="info-copy" style={{ color: 'var(--warning)' }}>
                Checkout is temporarily unavailable until a payment provider is configured.
              </p>
            )}
            {paymentInstructions ? <p className="info-copy">{paymentInstructions}</p> : null}
            {latestPaymentSession ? (
              <div className="portal-meta">
                <span className="status-badge">Latest session: {latestPaymentSession.status}</span>
                <span className="status-badge">Ref: {latestPaymentSession.reference}</span>
              </div>
            ) : null}
          </article>
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <article className="portal-card">
            <p className="section-label">Revision request</p>
            <h2 className="info-title">Tell the operator what should change.</h2>
            <form method="post" action={publicActionHref} className="field-grid">
              <input type="hidden" name="action" value="request_revision" />
              <input type="hidden" name="redirectTo" value={`/project/${project.id}?token=${project.publicToken}`} />
              <input type="hidden" name="token" value={project.publicToken} />
              <div className="field">
                <label htmlFor="note">Revision note</label>
                <textarea id="note" name="note" required placeholder="What should change in the draft?" />
              </div>
              <button className="button-secondary" type="submit">
                Request revision
              </button>
            </form>
          </article>

          <article className="portal-card">
            <p className="section-label">Current state</p>
            <h2 className="info-title">What the operator already knows.</h2>
            <ul className="detail-list">
              <li>
                <strong>Project ID:</strong> {project.id}
              </li>
              <li>
                <strong>Quoted price:</strong> £{project.quotedPrice ?? 0}
              </li>
              <li>
                <strong>Paid amount:</strong> £{project.paidAmount ?? 0}
              </li>
              <li>
                <strong>Revision count:</strong> {project.memory.revisions.length}
              </li>
            </ul>
          </article>
        </div>
      </section>

      {project.memory.revisions.length ? (
        <section className="section">
          <article className="portal-card">
            <p className="section-label">Revision history</p>
            <h2 className="info-title">Past change requests</h2>
            <div className="timeline">
              {project.memory.revisions
                .slice()
                .reverse()
                .map((revision) => (
                  <div key={revision.id} className="timeline-item">
                    <p>{revision.note}</p>
                    <time dateTime={revision.createdAt}>{new Date(revision.createdAt).toLocaleString()}</time>
                  </div>
                ))}
            </div>
          </article>
        </section>
      ) : null}
    </SiteShell>
  )
}
