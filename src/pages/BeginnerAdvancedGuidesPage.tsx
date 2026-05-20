import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { BeginnerTierCrossLink } from '../components/BeginnerTierCrossLink'
import { BeginnersSidenav } from '../components/BeginnersSidenav'
import { ADVANCED_TUTORIALS } from './beginners/tutorials'

export function BeginnerAdvancedGuidesPage() {
  return (
    <div className="beginners-layout">
      <BeginnersSidenav
        sectionTitle="Advanced"
        indexTo="/beginners/advanced"
        indexLabel="Advanced guides"
        tutorials={ADVANCED_TUTORIALS}
        crossLink={{ to: '/beginners', label: 'Basics guides' }}
      />

      <div className="beginners-layout__main">
        <header className="page-header fade-up">
          <p className="eyebrow">Advanced guides</p>
          <h1>Weather, wildlife and beyond the basics</h1>
        </header>

        {ADVANCED_TUTORIALS.map((t) => (
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
            {t.id === 'attract-small-mammals' ? (
              <BeginnerTierCrossLink
                title="Basics guides"
                description="Read your garden, establish plants, mulch and water — the core steps for your first native-friendly garden."
                to="/beginners"
                linkLabel="View basics guides"
              />
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
