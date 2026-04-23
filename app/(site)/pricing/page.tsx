import Link from 'next/link'

import { SiteShell } from '@/components/site-shell'

const packages = [
  {
    name: 'Refresh',
    price: '£79',
    description: 'Best for improving an existing page without widening scope.',
    bullets: ['Existing-page refresh', 'Copy tightening', '1 revision round'],
  },
  {
    name: 'Starter',
    price: '£99–149',
    description: 'For a clean single-page launch with one core conversion path.',
    bullets: ['One landing page', 'Core CTA flow', '1 revision round'],
  },
  {
    name: 'Pro',
    price: '£199–249',
    description: 'For higher-stakes launches needing a stronger positioning pass.',
    bullets: ['Custom landing page', 'Stronger copy pass', '2 revision rounds'],
  },
]

export default function PricingPage() {
  return (
    <SiteShell>
      <section className="hero">
        <p className="eyebrow">Pricing</p>
        <h1 className="page-title">Simple packages. Bounded scope. Clear operator behaviour.</h1>
        <p className="page-copy">
          OperatorOS uses fixed pricing bands so the system can quote safely, consistently, and without inventing scope on the fly.
        </p>
      </section>

      <section className="section">
        <div className="grid-3">
          {packages.map((pkg) => (
            <article key={pkg.name} className="card">
              <div className="status-note">{pkg.name}</div>
              <h2 className="card-title">{pkg.price}</h2>
              <p className="card-copy">{pkg.description}</p>
              <ul className="package-list">
                {pkg.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="grid-2">
          <article className="info-block">
            <p className="section-label">Why bands</p>
            <h2 className="info-title">Pricing is intentionally constrained.</h2>
            <p className="info-copy">
              The goal is not to imitate a human freelancer improvising prices. The goal is to let the operator quote inside a safe envelope and escalate when the request does not fit.
            </p>
          </article>
          <article className="info-block">
            <p className="section-label">Next step</p>
            <h2 className="info-title">Submit a brief and get a real quote.</h2>
            <p className="info-copy">
              Tell the operator what you are launching, who it is for, and what action the page should drive.
            </p>
            <div className="button-row">
              <Link href="/brief" className="button">
                Start a project
              </Link>
            </div>
          </article>
        </div>
      </section>
    </SiteShell>
  )
}
