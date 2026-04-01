import { useLocationArea } from '../context/LocationContext'
import { seasonalCards } from '../data/seasonal'

export function SeasonalPage() {
  const { areaLabel, regionCode } = useLocationArea()

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Seasonal</p>
        <h1>Recommendations</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Horizontal scroll for the best picks and eco-friendly ideas this season
          {regionCode ? (
            <>
              {' '}
              — personalised for{' '}
              <strong style={{ color: 'var(--color-text)' }}>{areaLabel}</strong>.
            </>
          ) : (
            '. Set your local area in the bar above for climate-relevant tips.'
          )}
        </p>
      </header>

      <div className="h-scroll" role="region" aria-label="Seasonal recommendation cards">
        {seasonalCards.map((card) => (
          <article key={card.id} className="card" style={{ width: '100%', maxWidth: 280 }}>
            <div
              style={{
                height: 6,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
              }}
            />
            <div className="card-body">
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-sm)' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
                {card.description}
              </p>
              <div className="chip-row" style={{ marginBottom: 'var(--space-md)' }}>
                {card.tags.map((t) => (
                  <span key={t} className="badge badge-neutral">
                    {t}
                  </span>
                ))}
              </div>
              <div
                style={{
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg)',
                  fontSize: '0.85rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                <strong style={{ color: 'var(--color-primary)' }}>Eco tip · </strong>
                {card.ecoTip}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="section-block" style={{ marginTop: 'var(--space-2xl)' }}>
        <h2>Why it matters</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '42rem' }}>
          Choosing plants that suit the season reduces water use, supports pollinators when they need
          it most, and keeps excess fertiliser out of waterways — especially important across
          Australia’s varied climates.
        </p>
      </section>
    </>
  )
}
