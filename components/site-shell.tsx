import Link from 'next/link'

export function SiteShell({
  children,
  compact = false,
}: {
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <div className="page-shell">
      <header className="site-nav">
        <div className="site-nav__inner">
          <Link href="/" className="site-brand">
            <span className="site-brand__mark">OS</span>
            <span>
              <p className="site-brand__eyebrow">OperatorOS</p>
              <p className="site-brand__name">AI-run landing page studio</p>
            </span>
          </Link>
          <nav className="site-links" aria-label="Primary">
            <Link href="/pricing" className="site-link">
              Pricing
            </Link>
            <Link href="/faq" className="site-link">
              FAQ
            </Link>
            <Link href="/brief" className="nav-cta">
              Start a project
            </Link>
          </nav>
        </div>
      </header>
      <div className="site-shell">{children}</div>
      {!compact ? (
        <footer className="site-shell footer">
          <div className="footer-card">
            <div>
              <strong>OperatorOS</strong>
              <div>Autonomous service operations with bounded risk and visible logs.</div>
            </div>
            <div className="footer-links">
              <Link href="/pricing" className="site-link">
                Pricing
              </Link>
              <Link href="/faq" className="site-link">
                FAQ
              </Link>
              <Link href="/owner/login" className="site-link">
                Operator login
              </Link>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
