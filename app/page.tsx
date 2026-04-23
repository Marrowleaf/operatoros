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

const signals = [
  'Quote policy in fixed package bands',
  'Client portal with preview and revision loop',
  'Approval queue for risky delivery actions',
  'Replayable operator activity and state transitions',
]

const showcaseRows = [
  ['Intake', 'Founder brief is captured and normalized into a live project record.'],
  ['Quote', 'The system prices inside policy or escalates without bluffing.'],
  ['Draft', 'A first landing page draft is generated and immediately previewable.'],
  ['Operate', 'Revisions, payments, approvals, and delivery stay in one operator loop.'],
]

export default function HomePage() {
  return (
    <SiteShell>
      <section className="hero hero--premium">
        <div className="hero-grid hero-grid--premium">
          <div>
            <div className="hero-badges">
              <span className="badge badge--accent">OperatorOS Studio</span>
              <span className="badge">AI-run service business</span>
            </div>
            <h1 className="hero-title hero-title--wide">A real AI-operated landing page studio with controls, approvals, and visible ops.</h1>
            <p className="hero-copy hero-copy--premium">
              OperatorOS turns a founder brief into a quoted project, generated draft, revision workflow, payment step, and controlled delivery path.
              It feels less like a template site and more like an actual operating system for an autonomous internet business.
            </p>
            <div className="hero-actions">
              <Link href="/brief" className="button">
                Start a project
              </Link>
              <Link href="/pricing" className="button-secondary">
                View pricing
              </Link>
            </div>
            <div className="hero-proof-strip" aria-label="Key proof points">
              <div className="proof-item">
                <strong>Real intake</strong>
                <span>Every brief becomes a tracked project.</span>
              </div>
              <div className="proof-item">
                <strong>Bounded risk</strong>
                <span>Pricing and delivery stay inside guardrails.</span>
              </div>
              <div className="proof-item">
                <strong>Visible ops</strong>
                <span>Actions, revisions, and approvals are reviewable.</span>
              </div>
            </div>
          </div>

          <aside className="glass-panel hero-card hero-card--premium" aria-label="How the operator works">
            <div className="stack-sm">
              <p className="hero-card__label">Operator control surface</p>
              <h2 className="hero-card__title">A delivery loop that behaves like an operator, not a brochure.</h2>
            </div>
            <ul className="hero-card__list">
              {signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
            <div className="metric-card-grid">
              <div className="metric-card">
                <span className="metric-card__value">4</span>
                <span className="metric-card__label">Core control layers</span>
              </div>
              <div className="metric-card">
                <span className="metric-card__value">0</span>
                <span className="metric-card__label">Hidden human fulfilment by default</span>
              </div>
            </div>
            <div className="inline-note">Guardrail principle: humans stay in the review role, not the default production role.</div>
          </aside>
        </div>
      </section>

      <section className="section section--spacious">
        <div className="section-header">
          <div>
            <p className="section-label">System walkthrough</p>
            <h2 className="section-title">The service is designed to feel controlled, premium, and operationally real.</h2>
          </div>
        </div>
        <div className="showcase-panel">
          <div className="showcase-panel__main">
            <div className="showcase-terminal">
              <div className="showcase-terminal__top">
                <span />
                <span />
                <span />
              </div>
              <div className="showcase-terminal__body">
                {showcaseRows.map(([title, body], index) => (
                  <div key={title} className="showcase-row">
                    <div className="showcase-row__index">0{index + 1}</div>
                    <div>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="showcase-panel__side">
            <div className="showcase-note">
              <p className="section-label">Why this feels better</p>
              <h3 className="card-title">Less vague AI fluff. More evidence of the actual loop.</h3>
              <p className="card-copy">
                The site now shows the path from brief to quote to draft to controlled delivery, instead of hiding the system behind generic marketing copy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="section-label">Three stages</p>
            <h2 className="section-title">The core motion stays fast for customers and safe for the operator.</h2>
          </div>
        </div>
        <div className="grid-3">
          {steps.map((step, index) => (
            <article key={step.title} className="card card--elevated">
              <div className="card-kicker">0{index + 1}</div>
              <h3 className="card-title">{step.title}</h3>
              <p className="card-copy">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--contrast">
        <div className="grid-2">
          <article className="info-block info-block--feature">
            <p className="section-label">Why it feels better</p>
            <h2 className="info-title">More signal, less vague AI fluff.</h2>
            <p className="info-copy">
              The product now clearly shows what happens after the brief: quote generation, draft production, client portal access, revision handling, payment state, and delivery controls.
            </p>
            <ul className="feature-list">
              <li>Clear pricing bands instead of vague “contact us” ambiguity</li>
              <li>A client portal for previews and revisions</li>
              <li>Operator approvals for risky work</li>
            </ul>
          </article>

          <article className="info-block info-block--cta">
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
