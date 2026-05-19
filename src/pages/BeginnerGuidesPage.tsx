import { useLayoutEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { GardensForWildlifeBlurb } from '../components/GardensForWildlifeBlurb'
import { BEGINNER_RESOURCES_HASH, scrollToBeginnerResources } from '../lib/beginnerResourcesNav'
import { TUTORIALS } from './beginners/tutorials'

export function BeginnerGuidesPage() {
  const location = useLocation()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    if (raw === BEGINNER_RESOURCES_HASH) {
      requestAnimationFrame(() => scrollToBeginnerResources())
      return
    }
    if (TUTORIALS.some((t) => t.id === raw)) {
      navigate(`/beginners/${raw}`, { replace: true })
    }
  }, [location.hash, location.pathname, navigate])

  const stepLinkClass = ({ isActive }: { isActive: boolean }) =>
    `beginners-sidenav__link${isActive ? ' beginners-sidenav__link--active' : ''}`

  return (
    <div className="beginners-layout">
      <aside className="beginners-sidenav" aria-label="Basics navigation">
        <p className="beginners-sidenav__title">Basics</p>
        <NavLink to="/beginners" className={stepLinkClass} end>
          All guides
        </NavLink>
        {TUTORIALS.map((t) => (
          <NavLink key={t.id} to={`/beginners/${t.id}`} className={stepLinkClass}>
            {t.title}
          </NavLink>
        ))}
      </aside>

      <div className="beginners-layout__main">
        <header className="page-header fade-up">
          <p className="eyebrow">Beginner guides</p>
          <h1>Step-by-step: your first native-friendly garden</h1>
        </header>

        {TUTORIALS.map((t) => (
          <section key={t.id} className="card beginner-tutorial" aria-labelledby={`${t.id}-heading`}>
            <h2 id={`${t.id}-heading`}>{t.title}</h2>
            <p className="beginner-tutorial__intro">{t.intro}</p>
            <p style={{ margin: 0 }}>
              <Link to={`/beginners/${t.id}`} className="home-impact__more-link">
                Open this guide
              </Link>
            </p>
          </section>
        ))}

        <section
          id="beginner-resources"
          className="card beginner-tutorial"
          aria-labelledby="beginner-resources-heading"
        >
          <h2 id="beginner-resources-heading">More help & resources</h2>
          <ul className="beginner-resources__list">
            <li>
              <GardensForWildlifeBlurb />
            </li>
            <li>
              <a href="https://weeds.org.au/" target="_blank" rel="noopener noreferrer">
                Weeds Australia
              </a>
              {' '}
              — national guide to identifying and managing invasive plants.
            </li>
          </ul>
        </section>

        <section className="learn-cta" style={{ marginTop: 'var(--space-xl)' }}>
          <h2>Ready to pick plants?</h2>
          <p>
            Filter by your area, sun and soil in PlantMe, then visit a local nursery from the map to confirm labels and
            pot sizes before you dig.
          </p>
          <div className="learn-cta__actions">
            <Link to="/plants" className="btn btn-primary">
              Open PlantMe
            </Link>
            <Link to="/map" className="btn btn-secondary">
              Nursery map
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
