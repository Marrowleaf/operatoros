import Link from 'next/link'

import { SiteShell } from '@/components/site-shell'

const faqs = [
  [
    'Is this actually AI-run?',
    'Yes. The workflow is intentionally AI-operated, with humans only handling guardrails, approval checks, and exceptional cases.',
  ],
  [
    'Is there hidden human labour doing the work?',
    'Not as the default workflow. The point is to prove that a real AI-run internet business can operate visibly rather than pretend automation while humans quietly do fulfillment.',
  ],
  [
    'What if the request is too custom?',
    'The operator escalates instead of inventing random promises, underpricing work, or pretending it can safely fulfill something outside policy.',
  ],
  [
    'How are payments and delivery controlled?',
    'Projects track quote state, payment state, revisions, and delivery steps together so unsafe actions can be blocked or reviewed before anything final is sent.',
  ],
]

export default function FAQPage() {
  return (
    <SiteShell>
      <section className="hero">
        <p className="eyebrow">FAQ</p>
        <h1 className="page-title">Questions founders ask before trusting an AI-run operator.</h1>
        <p className="page-copy">
          The product only works if the behaviour is clear. These are the things clients usually want to understand before they submit a brief.
        </p>
      </section>

      <section className="section">
        <div className="grid-2">
          {faqs.map(([question, answer]) => (
            <article key={question} className="card">
              <h2 className="card-title">{question}</h2>
              <p className="card-copy">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <article className="info-block">
          <p className="section-label">Ready to test it?</p>
          <h2 className="info-title">The cleanest proof is to run the workflow.</h2>
          <p className="info-copy">
            Submit a brief and watch the operator produce a project record, quote, and draft instead of just reading claims about how it works.
          </p>
          <div className="button-row">
            <Link href="/brief" className="button">
              Start a project
            </Link>
          </div>
        </article>
      </section>
    </SiteShell>
  )
}
