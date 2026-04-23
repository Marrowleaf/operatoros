import Link from 'next/link'

import { SiteShell } from '@/components/site-shell'

const steps = [
  {
    title: 'Bounded intake',
    body: 'The operator captures the brief, scores complexity, and produces a quote inside a fixed policy range instead of freelancing promises.',
  },
  {
    title: 'Immediate draft',
    body: 'A first landing page draft is generated fast, previewable by the client, and tied to a real project record from minute one.',
  },
  {
    title: 'Controlled delivery',
    body: 'Payments, revisions, approvals, and logs all live in the same loop so risky actions stay bounded and auditable.',
  },
]

export default function HomePage() {
  return (
    <SiteShell>
      <section className="hero">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">OperatorOS Studio</p>
            <h1 className="hero-title">An AI-run landing page service with a real operator loop.</h1>
            <p className="hero-copy">
              OperatorOS turns a founder brief into a quoted project, generated draft, revision workflow, payment step, and controlled delivery path.
              It is a real operating system for an AI-run service business, not a fake mockup.
            </p>
            <div className="hero-actions">
              <Link href="/brief" className="button">
                Start a project
              </Link>
              <Link href="/pricing" className="button-secondary">
                View pricing
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <strong>Real intake</strong>
                <span>Every brief creates a real tracked project record.</span>
              </div>
              <div className="stat">
                <strong>Bounded risk</strong>
                <span>Quotes, approvals, and payments sit behind policy guardrails.</span>
              </div>
              <div className="stat">
                <strong>Visible ops</strong>
                <span>Drafts, revisions, and operator actions are reviewable end to end.</span>
              </div>
            </div>
          </div>

          <aside className="glass-panel hero-card" aria-label="How the operator works">
            <p className="hero-card__label">What the system does</p>
            <h2 className="hero-card__title">A delivery loop that behaves like an operator, not a brochure.</h2>
            <ul className="hero-card__list">
              <li>Quotes inside fixed package and escalation rules</li>
              <li>Generates the first draft immediately after intake</li>
              <li>Tracks revisions through the client portal</li>
              <li>Blocks unsafe delivery behind approvals and payment state</li>
            </ul>
            <div className="inline-note">Guardrail principle: humans stay in the review role, not the default production role.</div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="section-label">Three stages</p>
            <h2 className="section-title">The service is designed to feel controlled, fast, and trustworthy.</h2>
          </div>
        </div>
        <div className="grid-3">
          {steps.map((step, index) => (
            <article key={step.title} className="card">
              <div className="card-kicker">0{index + 1}</div>
              <h3 className="card-title">{step.title}</h3>
              <p className="card-copy">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <article className="info-block">
            <p className="section-label">Why it feels better</p>
            <h2 className="info-title">More signal, less vague AI fluff.</h2>
            <p className="info-copy">
              The site now clearly shows what happens after the brief: quote generation, draft production, client portal access, revision handling, payment state, and delivery controls.
            </p>
            <ul className="feature-list">
              <li>Clear pricing bands instead of vague “contact us” ambiguity</li>
              <li>A client portal for previews and revisions</li>
              <li>Operator approvals for risky work</li>
            </ul>
          </article>

          <article className="info-block">
            <p className="section-label">Start point</p>
            <h2 className="info-title">Submit a brief and get the loop moving.</h2>
            <p className="info-copy">
              The fastest way to judge the system is to run it. Start with your offer, audience, and CTA. OperatorOS will create a project, quote it, and produce the first draft.
            </p>
            <div className="button-row">
              <Link href="/brief" className="button">
                Start a project
              </Link>
              <Link href="/faq" className="button-ghost">
                Read FAQ
              </Link>
            </div>
          </article>
        </div>
      </section>
    </SiteShell>
  )
}
