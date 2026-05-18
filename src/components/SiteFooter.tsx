import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BEGINNER_RESOURCES_PATH } from '../lib/beginnerResourcesNav'
import { FooterPageLink } from './FooterPageLink'

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

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Site">
      <nav className="site-footer__grid" aria-label="Footer links">
        <div className="site-footer__brand-col">
          <FooterPageLink to="/" className="site-footer__brand">
            RootVio
          </FooterPageLink>
          <p className="site-footer__tagline">Grow smart. Garden responsibly.</p>
        </div>
        <FooterCol title="Explore">
          <li>
            <FooterPageLink to="/plants">PlantMe</FooterPageLink>
          </li>
          <li>
            <FooterPageLink to="/planner">Garden planner</FooterPageLink>
          </li>
          <li>
            <Link to="/weed#weed-checker">Plant identifier</Link>
          </li>
          <li>
            <FooterPageLink to="/map">Nursery map</FooterPageLink>
          </li>
        </FooterCol>
        <FooterCol title="Education">
          <li>
            <Link to="/learn#native">Native plants</Link>
          </li>
          <li>
            <Link to="/learn#environmental-weeds">Environmental weeds</Link>
          </li>
          <li>
            <FooterPageLink to="/beginners">Beginner tutorials</FooterPageLink>
          </li>
        </FooterCol>
        <FooterCol title="Connect">
          <li>
            <Link to={BEGINNER_RESOURCES_PATH}>Council support</Link>
          </li>
          <li>
            <FooterPageLink to="/about">About us</FooterPageLink>
          </li>
        </FooterCol>
      </nav>
    </footer>
  )
}
