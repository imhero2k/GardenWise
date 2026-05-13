import { useLayoutEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { TUTORIALS } from './beginners/tutorials'

export function BeginnerGuidesPage() {
  const location = useLocation()
  const navigate = useNavigate()

  useLayoutEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    navigate(`/beginners/${raw}`, { replace: true })
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
          <p style={{ color: 'var(--color-text-muted)', margin: 0, maxWidth: '42rem' }}>
            Short tutorials you can follow in order — from understanding your yard to planting, watering and easy
            upkeep. Pair these steps with{' '}
            <Link to="/plants">PlantMe</Link>, the <Link to="/weed#weed-checker">weed checker</Link>
            {', and '}
            <Link to="/learn#native">native plants 101</Link> when you want more context.
          </p>
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

        <section className="card beginner-tutorial" aria-labelledby="beginner-resources-heading">
          <h2 id="beginner-resources-heading">More help & resources</h2>
          <p className="beginner-tutorial__intro" style={{ maxWidth: '46rem' }}>
            If you’re stuck, these pages make the next decision easier: pick the right plants for your conditions, check
            whether a garden plant is risky, and find a local nursery for labels and advice.
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7 }}>
            <li>
              <Link to="/plants">PlantMe</Link> — filter by sun, soil and your area.
            </li>
            <li>
              <Link to="/weed#weed-checker">Weed checker</Link> — confirm if a plant can spread into bushland.
            </li>
            <li>
              <Link to="/map">Nursery map</Link> — find nurseries and public gardens near you.
            </li>
            <li>
              <Link to="/learn#native">Native plants 101</Link> — simple explanations and examples.
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
