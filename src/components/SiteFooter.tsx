import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

function FooterCol({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="site-footer__col">
      <h2 className="site-footer__heading">{title}</h2>
      <ul className="site-footer__list">{children}</ul>
    </div>
  )
}

function FooterMuted({ children }: { children: ReactNode }) {
  return <span className="site-footer__muted">{children}</span>
}

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site">
      <nav className="site-footer__grid" aria-label="Footer links">
        <div className="site-footer__brand-col">
          <Link to="/" className="site-footer__brand">
            RootVio
          </Link>
          <p className="site-footer__tagline">Grow smart. Garden responsibly.</p>
        </div>
        <FooterCol title="Explore">
          <li>
            <Link to="/plants">PlantMe</Link>
          </li>
          <li>
            <Link to="/planner">Garden planner</Link>
          </li>
          <li>
            <Link to="/weed#weed-checker">Plant safety check</Link>
          </li>
          <li>
            <Link to="/map">Nursery map</Link>
          </li>
        </FooterCol>
        <FooterCol title="Education">
          <li>
            <Link to="/learn#native">Native plants</Link>
          </li>
          <li>
            <Link to="/learn#invasive">Environmental weeds</Link>
          </li>
          <li>
            <FooterMuted>Gardening tutorial</FooterMuted>
          </li>
        </FooterCol>
        <FooterCol title="Connect">
          <li>
            <FooterMuted>Council support</FooterMuted>
          </li>
          <li>
            <FooterMuted>About us</FooterMuted>
          </li>
        </FooterCol>
      </nav>
    </footer>
  )
}
