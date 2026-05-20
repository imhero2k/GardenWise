import { Fragment, useLayoutEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BeginnerTierCrossLink } from '../components/BeginnerTierCrossLink'
import { GardensForWildlifeBlurb } from '../components/GardensForWildlifeBlurb'
import { BeginnersSidenav } from '../components/BeginnersSidenav'
import { BEGINNER_RESOURCES_HASH, scrollToBeginnerResources } from '../lib/beginnerResourcesNav'
import { BASIC_TUTORIALS, TUTORIALS } from './beginners/tutorials'

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

  return (
    <div className="beginners-layout">
      <BeginnersSidenav
        sectionTitle="Basics"
        indexTo="/beginners"
        indexLabel="Basic guides"
        tutorials={BASIC_TUTORIALS}
        crossLink={{ to: '/beginners/advanced', label: 'Advanced guides' }}
      />

      <div className="beginners-layout__main">
        <header className="page-header fade-up">
          <p className="eyebrow">Beginner guides</p>
          <h1>Step-by-step: your first native-friendly garden</h1>
        </header>

        {BASIC_TUTORIALS.map((t) => (
          <Fragment key={t.id}>
            <section className="card beginner-tutorial" aria-labelledby={`${t.id}-heading`}>
              <h2 id={`${t.id}-heading`}>{t.title}</h2>
              <p className="beginner-tutorial__intro">{t.intro}</p>
              <p style={{ margin: 0 }}>
                <Link to={`/beginners/${t.id}`} className="home-impact__more-link">
                  Open this guide
                </Link>
              </p>
            </section>
            {t.id === 'watering-guide' ? (
              <BeginnerTierCrossLink
                title="Advanced guides"
                description="Extreme heat and cold, attracting birds, insects and small mammals — for when you are ready to go further."
                to="/beginners/advanced"
                linkLabel="View advanced guides"
              />
            ) : null}
          </Fragment>
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
