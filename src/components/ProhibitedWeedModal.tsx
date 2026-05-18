import { useEffect, useState } from 'react'
import { enrichPlantByScientificName, type PlantEnrichment } from '../lib/plantEnrichment'
import type { StateProhibitedWeed } from '../lib/stateProhibitedWeeds'

const VIC_REPORT_URL =
  'https://agriculture.vic.gov.au/biosecurity/weeds/stop-the-sale-stop-the-spread/report-a-state-prohibited-weed'

export function ProhibitedWeedModal({ weed, onClose }: { weed: StateProhibitedWeed; onClose: () => void }) {
  const [enrichment, setEnrichment] = useState<PlantEnrichment | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    const ac = new AbortController()
    setLoadState('loading')
    setEnrichment(null)
    enrichPlantByScientificName(weed.wikipediaQuery, ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return
        setEnrichment(data)
        setLoadState('done')
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setLoadState('error')
      })
    return () => ac.abort()
  }, [weed.wikipediaQuery])

  const wikipediaUrl =
    enrichment?.wikipedia?.pageUrl ?? enrichment?.inaturalist?.wikipediaUrl ?? undefined

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prohibited-weed-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-hover)',
          maxWidth: 560,
          width: '100%',
          maxHeight: 'min(90vh, 720px)',
          overflowY: 'auto',
          padding: 'var(--space-xl)',
          position: 'relative',
          animation: 'fade-up 0.2s ease forwards',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            right: 'var(--space-md)',
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            lineHeight: 1,
            padding: '0.25rem',
          }}
        >
          ×
        </button>

        <span className="badge badge-high" style={{ marginBottom: 'var(--space-sm)' }}>
          State Prohibited Weed
        </span>
        <h3 id="prohibited-weed-modal-title" style={{ color: 'var(--color-primary-dark)', marginBottom: '0.2rem' }}>
          {weed.name}
        </h3>
        <p
          style={{
            margin: '0 0 var(--space-md)',
            fontSize: '0.88rem',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
          }}
        >
          {weed.wikipediaQuery}
        </p>

        <div
          style={{
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: 'var(--space-md)',
            border: '1px solid rgba(0,0,0,0.08)',
            maxHeight: 200,
          }}
        >
          <img
            src={weed.imgUrl}
            alt={weed.name}
            style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            referrerPolicy="no-referrer"
          />
        </div>

        <p style={{ margin: '0 0 var(--space-md)', fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.7 }}>
          {weed.desc}
        </p>

        {loadState === 'loading' && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-md)' }}>
            Loading Wikipedia summary…
          </p>
        )}

        {loadState === 'error' && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-md)' }}>
            Could not load extra reference information right now.
          </p>
        )}

        {loadState === 'done' && enrichment?.wikipedia && (
          <div
            style={{
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h4 style={{ fontSize: '0.9rem', margin: '0 0 var(--space-sm)', color: 'var(--color-primary-dark)' }}>
              From Wikipedia
            </h4>
            <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
              {enrichment.wikipedia.extract}
            </p>
            <a
              href={enrichment.wikipedia.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.88rem' }}
            >
              Read full article on Wikipedia →
            </a>
          </div>
        )}

        {loadState === 'done' && !enrichment?.wikipedia && wikipediaUrl && (
          <p style={{ margin: '0 0 var(--space-md)' }}>
            <a
              href={wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.88rem' }}
            >
              Read on Wikipedia →
            </a>
          </p>
        )}

        {loadState === 'done' && enrichment?.images && enrichment.images.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-sm)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-md)',
            }}
          >
            {enrichment.images.slice(0, 3).map((img) => (
              <figure
                key={img.url}
                style={{
                  margin: 0,
                  width: 120,
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <img
                  src={img.url}
                  alt=""
                  style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <figcaption style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                  {img.source === 'wikipedia' ? 'Wikipedia' : 'iNaturalist'}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <a
          href={VIC_REPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="weed-report-cta"
          style={{ display: 'inline-block', marginTop: 'var(--space-sm)' }}
        >
          Report a State Prohibited Weed →
        </a>
      </div>
    </div>
  )
}
