import { useLayoutEffect } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { BeginnerMediaAttribution, BeginnerTutorialMedia } from '../components/BeginnerTutorialMedia'
import { BeginnersSidenav } from '../components/BeginnersSidenav'
import {
  getTutorialById,
  getTutorialsInTier,
  type TutorialSectionBody,
} from './beginners/tutorials'

function renderSectionBodyItem(b: TutorialSectionBody) {
  if (typeof b === 'string') {
    const splitAt = b.indexOf(':')
    if (splitAt > 0) {
      const lead = b.slice(0, splitAt)
      const rest = b.slice(splitAt + 1).trimStart()
      return (
        <li key={b}>
          <strong>{lead}:</strong> {rest}
        </li>
      )
    }
    return <li key={b}>{b}</li>
  }

  return (
    <li key={`${b.lead}-${b.link.to}`}>
      <strong>{b.lead}:</strong> {b.beforeLink}
      <Link to={b.link.to}>{b.link.label}</Link>
      {b.afterLink}
    </li>
  )
}

export function BeginnerGuideStepPage() {
  const { id } = useParams()
  const location = useLocation()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  const tutorial = getTutorialById(id)
  if (!tutorial) return <Navigate to="/beginners" replace />

  const tierTutorials = getTutorialsInTier(tutorial.tier)
  const idx = tierTutorials.findIndex((t) => t.id === tutorial.id)
  const prev = idx > 0 ? tierTutorials[idx - 1] : null
  const next = idx >= 0 && idx < tierTutorials.length - 1 ? tierTutorials[idx + 1] : null

  const isAdvanced = tutorial.tier === 'advanced'
  const indexTo = isAdvanced ? '/beginners/advanced' : '/beginners'
  const indexLabel = isAdvanced ? 'Advanced guides' : 'Basic guides'
  const backLabel = isAdvanced ? 'Back to advanced guides' : 'Back to basic guides'
  const eyebrow = isAdvanced ? 'Advanced guides' : 'Beginner guides'
  const allGuidesLabel = isAdvanced ? 'Advanced guides' : 'Basic guides'

  return (
    <div className="beginners-layout">
      <BeginnersSidenav
        sectionTitle={isAdvanced ? 'Advanced' : 'Basics'}
        indexTo={indexTo}
        indexLabel={indexLabel}
        tutorials={tierTutorials}
        crossLink={
          isAdvanced
            ? { to: '/beginners', label: 'Basics guides' }
            : { to: '/beginners/advanced', label: 'Advanced guides' }
        }
      />

      <div className="beginners-layout__main">
        <header className="page-header fade-up">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{tutorial.title}</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, maxWidth: '46rem' }}>
            {tutorial.intro}
          </p>
          {tutorial.media?.length ? (
            <BeginnerTutorialMedia media={tutorial.media} />
          ) : null}
          {tutorial.mediaPlaceholders?.length ? (
            <div className="beginner-media" aria-label="Image placeholders">
              {tutorial.mediaPlaceholders.map((m) => (
                <div key={m.label} className="beginner-media__ph" aria-hidden="true">
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          ) : null}
          <p style={{ margin: 'var(--space-md) 0 0' }}>
            <Link to={indexTo} className="home-impact__more-link">
              {backLabel}
            </Link>
          </p>
        </header>

        {tutorial.sections?.length
          ? tutorial.sections.map((s) => (
              <section key={s.title} className="card beginner-tutorial" aria-label={s.title}>
                <h2 style={{ marginBottom: 'var(--space-md)' }}>{s.title}</h2>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', lineHeight: 1.7 }}>
                  {s.body.map((b) => renderSectionBodyItem(b))}
                </ul>
              </section>
            ))
          : null}

        {tutorial.steps.length ? (
          <section className="card beginner-tutorial" aria-labelledby="beginner-step-heading">
            <h2 id="beginner-step-heading" style={{ marginBottom: 'var(--space-md)' }}>
              Steps
            </h2>
            <ol className="beginner-tutorial__steps">
              {tutorial.steps.map((step) => {
                if (!tutorial.plainSteps) {
                  const splitAt = step.indexOf(':')
                  if (splitAt > 0) {
                    const lead = step.slice(0, splitAt)
                    const rest = step.slice(splitAt + 1).trimStart()
                    return (
                      <li key={step}>
                        <strong>{lead}:</strong> {rest}
                      </li>
                    )
                  }
                }
                return <li key={step}>{step}</li>
              })}
            </ol>
          </section>
        ) : null}

        {tutorial.tip?.length ? (
          <section className="card beginner-tutorial" aria-label="Tips">
            <div className="beginner-tutorial__tip" style={{ margin: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-primary-dark)' }}>Tips</p>
              <ul style={{ margin: 'var(--space-sm) 0 0', paddingLeft: '1.15rem', lineHeight: 1.6 }}>
                {tutorial.tip.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {tutorial.related?.length ? (
          <section className="card beginner-tutorial" aria-label="Related guides">
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              Related:{' '}
              {tutorial.related.map((r, i) => (
                <span key={r.to}>
                  <Link to={r.to}>{r.label}</Link>
                  {i < tutorial.related!.length - 1 ? ' · ' : null}
                </span>
              ))}
            </p>
          </section>
        ) : null}

        <nav className="learn-cta" aria-label="Next steps" style={{ marginTop: 'var(--space-xl)' }}>
          <h2>Keep going</h2>
          <p>Move through the guides in order, or jump back to the full list.</p>
          <div className="learn-cta__actions" style={{ flexWrap: 'wrap' }}>
            {prev ? (
              <Link to={`/beginners/${prev.id}`} className="btn btn-secondary">
                ← {prev.title}
              </Link>
            ) : null}
            {next ? (
              <Link to={`/beginners/${next.id}`} className="btn btn-primary">
                Next: {next.title} →
              </Link>
            ) : null}
            <Link to={indexTo} className="btn btn-secondary">
              {allGuidesLabel}
            </Link>
          </div>
        </nav>

        {tutorial.mediaAttribution ? (
          <BeginnerMediaAttribution attribution={tutorial.mediaAttribution} />
        ) : null}
      </div>
    </div>
  )
}

