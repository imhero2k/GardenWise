import {
  type ChangeEventHandler,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ProhibitedWeedModal } from '../components/ProhibitedWeedModal'
import { IconBook, IconCamera } from '../components/Icons'
import { IconSearch } from '../components/Icons'
import { useLocationArea } from '../context/LocationContext'
import type { PlantEnrichment } from '../lib/plantEnrichment'
import { enrichPlantByScientificName } from '../lib/plantEnrichment'
import { identifyWithPlantNet } from '../lib/plantnet'
import type { PredictResponse } from '../lib/predict'
import { predictPlantFromBase64 } from '../lib/predict'
import {
  inferWeedDisposalCategory,
  weedDisposalTypeLabel,
  WEED_DISPOSAL_TYPE_LABELS,
  type WeedCategory,
} from '../lib/weedDisposalCategory'
import {
  matchStateProhibitedWeed,
  STATE_PROHIBITED_WEEDS,
  stateProhibitedWeedElementId,
  VIC_STATE_PROHIBITED_WEED_REPORT_URL,
  type StateProhibitedWeed,
} from '../lib/stateProhibitedWeeds'
import { fetchTopWeeds, fetchWeedLookup, type RegionWeed } from '../lib/weedsApi'
import {
  useRecommendedPlantEnrichment,
  type EnrichmentState,
} from '../hooks/useRecommendedPlantEnrichment'

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error'

type ConfidenceTier = 'high' | 'medium' | 'low'

const TOP_WEEDS_PAGE_SIZE = 12

function getConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

const CONFIDENCE_TIER = {
  high: {
    label: 'Strong match',
    subtitle: 'Model is highly confident.',
    gradient:
      'linear-gradient(145deg, rgba(46, 125, 50, 0.22) 0%, rgba(129, 199, 132, 0.38) 45%, rgba(200, 230, 201, 0.35) 100%)',
    border: '2px solid rgba(46, 125, 50, 0.5)',
    shadow: '0 8px 28px rgba(46, 125, 50, 0.18)',
    badgeBg: 'linear-gradient(135deg, #1b5e20, #2e7d32)',
    badgeColor: '#fff',
    bar: '#2e7d32',
    accent: '#1b5e20',
  },
  medium: {
    label: 'Moderate confidence',
    subtitle: 'Good hint — confirm with another photo or a field guide.',
    gradient:
      'linear-gradient(145deg, rgba(255, 193, 7, 0.28) 0%, rgba(255, 224, 130, 0.45) 50%, rgba(255, 249, 196, 0.35) 100%)',
    border: '2px solid rgba(245, 124, 0, 0.45)',
    shadow: '0 8px 28px rgba(245, 124, 0, 0.15)',
    badgeBg: 'linear-gradient(135deg, #e65100, #fb8c00)',
    badgeColor: '#fff',
    bar: '#f57c00',
    accent: '#e65100',
  },
  low: {
    label: 'Uncertain',
    subtitle: 'Treat as a suggestion only — verify before acting.',
    gradient:
      'linear-gradient(145deg, rgba(239, 83, 80, 0.2) 0%, rgba(255, 138, 128, 0.32) 55%, rgba(255, 205, 210, 0.28) 100%)',
    border: '2px solid rgba(198, 40, 40, 0.45)',
    shadow: '0 8px 28px rgba(198, 40, 40, 0.14)',
    badgeBg: 'linear-gradient(135deg, #b71c1c, #e53935)',
    badgeColor: '#fff',
    bar: '#c62828',
    accent: '#b71c1c',
  },
} as const

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

function isWeedModelIdentification(result: PredictResponse): boolean {
  return result.source !== 'plantnet'
}

function plantNamesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function resolveIdentificationCommonName(
  scientificName: string,
  sources: Array<string | null | undefined>,
): string | null {
  const sci = scientificName.trim()
  for (const source of sources) {
    const name = source?.trim()
    if (!name) continue
    if (sci && plantNamesMatch(name, sci)) continue
    return name
  }
  return null
}

const WEED_BADGE_STYLE: CSSProperties = {
  display: 'inline-block',
  padding: '0.35rem 0.85rem',
  borderRadius: 999,
  fontSize: '0.78rem',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: 'linear-gradient(135deg, #b71c1c, #e53935)',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(183, 28, 28, 0.25)',
}

function getIdentificationSummary(result: PredictResponse): {
  heading: string
  subtitle: string
  showWeedBadge: boolean
} {
  if (isWeedModelIdentification(result)) {
    return {
      heading: 'Likely weed match',
      subtitle:
        'Our weed identification model classified this plant as a weed — confirm before removal or disposal.',
      showWeedBadge: true,
    }
  }

  return {
    heading: 'Likely match',
    subtitle: 'Pl@ntNet identified this plant — confirm before removal or disposal.',
    showWeedBadge: false,
  }
}

const POOR_MATCH_PHOTO_TIPS = [
  'Try a different angle — include leaves, flowers, fruit or seed heads if the plant has them.',
  'Fill the frame with the plant and avoid clutter (other species, mulch, tools, hands or busy backgrounds).',
  'Use even, natural light where you can — harsh shadow or strong backlight makes features harder to read.',
  'Photograph again when the plant is more developed — mature foliage and reproductive parts (flowers, seed) improve matches.',
] as const

function PoorMatchAdvice({ tier }: { tier: ConfidenceTier }) {
  if (tier === 'high') return null

  const isLow = tier === 'low'

  return (
    <div
      style={{
        marginBottom: 'var(--space-md)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 var(--space-sm)', color: 'var(--color-text)' }}>
        {isLow ? 'Low confidence — try another photo' : 'Moderate confidence — tips for a clearer photo'}
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-sm)' }}>
        {isLow
          ? 'This match is uncertain. Before relying on it, upload a new photo with the plant as the clear subject:'
          : 'For a stronger match next time:'}
      </p>
      <ul
        style={{
          margin: 0,
          paddingLeft: '1.15rem',
          fontSize: '0.88rem',
          color: 'var(--color-text)',
          lineHeight: 1.55,
        }}
      >
        {POOR_MATCH_PHOTO_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <p
        style={{
          fontSize: '0.82rem',
          color: 'var(--color-text-muted)',
          margin: 'var(--space-sm) 0 0',
          lineHeight: 1.5,
        }}
      >
        <strong>Disclaimer:</strong> Photo ID often works poorly on very young seedlings, bare stems, or plants
        with few distinguishing features. Treat uncertain results as a hint only — confirm with a field guide, nursery,
        or local weed officer before removal or disposal.
      </p>
    </div>
  )
}

function PredictionResultCard({
  result,
  matchedStateProhibitedWeed,
  suggestedDisposalCategory,
  onOpenDisposalGuide,
  onOpenStateProhibitedWeed,
}: {
  result: PredictResponse
  matchedStateProhibitedWeed: StateProhibitedWeed | null
  suggestedDisposalCategory: WeedCategory | null
  onOpenDisposalGuide: (type: WeedCategory) => void
  onOpenStateProhibitedWeed: (weed: StateProhibitedWeed) => void
}) {
  const tier = getConfidenceTier(result.confidence)
  const theme = CONFIDENCE_TIER[tier]
  const summary = getIdentificationSummary(result)
  const identifiedAsWeed =
    summary.showWeedBadge || isWeedModelIdentification(result) || matchedStateProhibitedWeed != null
  const pct = Math.round(result.confidence * 10000) / 100
  const barPct = Math.min(100, Math.max(0, result.confidence * 100))
  const sourceLabel = result.source === 'plantnet' ? 'Pl@ntNet identification' : 'Weed identification model'

  const [enrichment, setEnrichment] = useState<PlantEnrichment | null>(null)
  const [enrichState, setEnrichState] = useState<'loading' | 'done' | 'error'>('loading')
  const [weedLookupCommonName, setWeedLookupCommonName] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    enrichPlantByScientificName(result.label, ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return
        setEnrichment(data)
        setEnrichState('done')
      })
      .catch(() => {
        if (ac.signal.aborted) return
        setEnrichState('error')
      })
    return () => ac.abort()
  }, [result.label])

  useEffect(() => {
    const ac = new AbortController()
    setWeedLookupCommonName(null)
    fetchWeedLookup(result.label, { signal: ac.signal })
      .then((data) => {
        if (ac.signal.aborted) return
        setWeedLookupCommonName(data.match?.commonName ?? null)
      })
      .catch(() => {
        if (ac.signal.aborted) return
      })
    return () => ac.abort()
  }, [result.label])

  const commonName = useMemo(
    () =>
      resolveIdentificationCommonName(result.label, [
        result.commonName,
        matchedStateProhibitedWeed?.name,
        weedLookupCommonName,
        enrichment?.inaturalist?.commonName,
      ]),
    [
      result.label,
      result.commonName,
      matchedStateProhibitedWeed?.name,
      weedLookupCommonName,
      enrichment?.inaturalist?.commonName,
    ],
  )

  return (
    <div
      className="card card-body fade-up"
      style={{
        marginTop: 'var(--space-lg)',
        background: theme.gradient,
        border: theme.border,
        boxShadow: theme.shadow,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <h2 style={{ margin: 0, color: theme.accent }}>{summary.heading}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
          {summary.showWeedBadge && <span style={WEED_BADGE_STYLE}>Weed</span>}
          <span
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.7rem',
              borderRadius: 999,
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.75)',
              color: theme.accent,
              border: `1px solid ${theme.accent}40`,
            }}
          >
            {sourceLabel}
          </span>
          <span
            style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              background: theme.badgeBg,
              color: theme.badgeColor,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {theme.label}
          </span>
        </div>
      </div>
      <div style={{ marginBottom: 'var(--space-sm)' }}>
        {commonName ? (
          <p style={{ fontWeight: 700, margin: '0 0 0.2rem', fontSize: '1.15rem', color: 'var(--color-text)' }}>
            {commonName}
          </p>
        ) : null}
        <p
          style={{
            fontWeight: commonName ? 500 : 700,
            margin: 0,
            fontSize: commonName ? '1rem' : '1.15rem',
            fontStyle: commonName ? 'italic' : 'normal',
            color: commonName ? 'var(--color-text-muted)' : 'var(--color-text)',
          }}
        >
          {result.label}
        </p>
      </div>
      <p style={{ margin: '0 0 var(--space-md)', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
        {summary.subtitle}
      </p>

      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 'var(--space-xs)',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Model confidence</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: theme.accent }}>{pct}%</span>
        </div>
        <div
          style={{
            height: 12,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.65)',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${barPct}%`,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${theme.bar}, ${theme.bar}cc)`,
              transition: 'width 0.45s ease',
            }}
          />
        </div>
      </div>

      <PoorMatchAdvice tier={tier} />

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: 'var(--space-sm) 0',
        }}
      >
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Class index</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{result.class_index}</div>
        </div>
      </div>


      {matchedStateProhibitedWeed ? (
        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(230, 81, 0, 0.1)',
            border: '1px solid rgba(230, 81, 0, 0.35)',
          }}
        >
          <span className="badge badge-high" style={{ marginBottom: 'var(--space-sm)' }}>
            State Prohibited Weed
          </span>
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 var(--space-sm)', color: '#92400e' }}>
            Do not remove yourself
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', margin: '0 0 var(--space-md)', lineHeight: 1.55 }}>
            This matches <strong>{matchedStateProhibitedWeed.name}</strong>
            {result.label.trim() ? (
              <>
                {' '}
                (<em style={{ fontStyle: 'italic' }}>{result.label.trim()}</em>)
              </>
            ) : null}
            , a State Prohibited Weed in Victoria. You must not attempt removal — report it to the authorities
            immediately.
          </p>
          <div className="weed-prohibited-id-actions">
            <button
              type="button"
              className="weed-prohibited-id-btn weed-prohibited-id-btn--view"
              onClick={() => onOpenStateProhibitedWeed(matchedStateProhibitedWeed)}
            >
              View {matchedStateProhibitedWeed.name}
            </button>
            <a
              href={VIC_STATE_PROHIBITED_WEED_REPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="weed-prohibited-id-btn weed-prohibited-id-btn--report"
            >
              Report State Prohibited Weed
            </a>
          </div>
        </div>
      ) : identifiedAsWeed ? (
        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', margin: '0 0 var(--space-sm)', color: theme.accent }}>
            Disposal guide type
          </h3>
          {suggestedDisposalCategory ? (
            <>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text)', margin: '0 0 var(--space-md)', lineHeight: 1.55 }}>
                Based on the identified species, this looks like{' '}
                <strong>{weedDisposalTypeLabel(suggestedDisposalCategory)}</strong>.
              </p>
              <button
                type="button"
                className="weed-disposal-id-btn"
                onClick={() => onOpenDisposalGuide(suggestedDisposalCategory)}
              >
                View disposal guide for {weedDisposalTypeLabel(suggestedDisposalCategory)}
              </button>
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.55 }}>
              We could not infer a disposal category from growth form.{' '}
              <a href="#disposal" style={{ fontWeight: 600, color: theme.accent }}>
                Choose the best match in the disposal guide below
              </a>
              .
            </p>
          )}
        </div>
      ) : null}

      <details
        className="weed-learn-more"
        style={{ '--weed-learn-more-color': theme.accent } as CSSProperties}
      >
        <summary className="weed-learn-more__summary">Learn more</summary>
        <div className="weed-learn-more__body">
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-md)' }}>
          Reference photos and text from Wikipedia, GBIF taxonomy, and iNaturalist (public APIs — POC).
        </p>

        {enrichState === 'loading' && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>Loading reference info…</p>
        )}

        {enrichState === 'error' && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Could not load extra info right now. Try again later.
          </p>
        )}

        {enrichState === 'done' && enrichment && (
          <>
            {enrichment.images.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-sm)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-md)',
                }}
              >
                {enrichment.images.map((img) => (
                  <figure
                    key={img.url}
                    style={{
                      margin: 0,
                      width: 140,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                      background: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <figcaption
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--color-text-muted)',
                        padding: '0.25rem 0.35rem',
                        lineHeight: 1.25,
                      }}
                    >
                      {img.source === 'wikipedia' ? 'Wikipedia' : 'iNaturalist'}
                      {img.attribution ? ` · ${img.attribution.slice(0, 80)}${img.attribution.length > 80 ? '…' : ''}` : ''}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {enrichment.wikipedia && (
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {enrichment.wikipedia.extract}
                </p>
                <a
                  href={enrichment.wikipedia.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontWeight: 600, color: theme.accent, fontSize: '0.88rem' }}
                >
                  Read on Wikipedia →
                </a>
              </div>
            )}

            {!enrichment.wikipedia && enrichment.images.length === 0 && (
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '0 0 var(--space-md)' }}>
                No Wikipedia summary or community photos found for this exact name. Try verifying the spelling or check GBIF / iNaturalist below.
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
              {enrichment.gbif && (
                <a
                  href={enrichment.gbif.speciesPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}
                >
                  GBIF: {enrichment.gbif.canonicalName}
                  {enrichment.gbif.rank ? ` (${enrichment.gbif.rank})` : ''}
                </a>
              )}
              {enrichment.inaturalist && (
                <a
                  href={enrichment.inaturalist.taxonPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}
                >
                  iNaturalist
                  {enrichment.inaturalist.commonName ? `: ${enrichment.inaturalist.commonName}` : ''}
                </a>
              )}
              {enrichment.inaturalist?.wikipediaUrl && (
                <a
                  href={enrichment.inaturalist.wikipediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.82rem', fontWeight: 600, color: theme.accent }}
                >
                  iNat Wikipedia link →
                </a>
              )}
            </div>
          </>
        )}
        </div>
      </details>

      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
        Always confirm ID with your state biosecurity resource. This feature uses an ML model and can be wrong.
      </p>
    </div>
  )
}

function scrollElementWithFixedHeader(
  el: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
) {
  const rawPad = getComputedStyle(document.documentElement).getPropertyValue('--anchor-scroll-padding').trim()
  let pad = 0
  if (rawPad.endsWith('px')) pad = parseFloat(rawPad) || 0
  else if (rawPad) {
    const probe = document.createElement('div')
    probe.style.cssText = `position:absolute;left:0;top:0;width:0;height:calc(${rawPad});visibility:hidden;pointer-events:none`
    document.documentElement.appendChild(probe)
    pad = probe.getBoundingClientRect().height
    probe.remove()
  }
  const y = el.getBoundingClientRect().top + window.scrollY - pad
  window.scrollTo({ top: Math.max(0, y), behavior })
}

function WeedSection({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string
  title: string
  eyebrow?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="weed-page__section card"
      style={{
        padding: 'var(--space-lg)',
        marginTop: 'var(--space-lg)',
      }}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 style={{ marginTop: eyebrow ? 'var(--space-sm)' : 0, marginBottom: 'var(--space-md)' }}>{title}</h2>
      {children}
    </section>
  )
}

function TopWeedPlaceholderSlot({ variant }: { variant: 'loading' | 'empty' }) {
  const loading = variant === 'loading'
  return (
    <div
      className={`card card-media-top top-weed-card top-weed-card--placeholder${loading ? ' top-weed-card--placeholder--loading' : ''}`}
      aria-hidden="true"
      style={{
        textAlign: 'left',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 0,
        background: 'var(--color-surface)',
        pointerEvents: 'none',
      }}
    >
      <div className="card-media-top__imgwrap">
        <div className="top-weed-card__ph-image" />
      </div>
      <div className="card-body top-weed-card__body">
        <div className="top-weed-card__ph-line top-weed-card__ph-line--title" />
        <div className="top-weed-card__ph-line top-weed-card__ph-line--sub" />
        <div className="top-weed-card__ph-line top-weed-card__ph-line--link" />
      </div>
    </div>
  )
}

function TopWeedDetailContent({
  weed,
  enrichment,
}: {
  weed: RegionWeed
  enrichment?: EnrichmentState
}) {
  const common = weed.commonName?.trim()
  const sci = weed.scientificName
  const primaryTitle = common || sci || 'Weed'
  const extra =
    typeof enrichment === 'object' && enrichment !== null ? enrichment : undefined
  const hero = extra?.imageUrl
  const summary = extra?.description
  const link = extra?.linkUrl

  const showSci = Boolean(common && sci && common.toLowerCase() !== sci.toLowerCase())

  return (
    <div className="plant-detail-dialog__content">
      {hero && (
        <div className="plant-detail-dialog__hero">
          <img src={hero} alt="" loading="lazy" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="plant-detail-dialog__details">
        <div className="plant-detail-dialog__intro">
          <p className="plant-detail-dialog__primary">{primaryTitle}</p>
          {showSci && <p className="plant-detail-dialog__sci">{sci}</p>}
          <ul className="plant-detail-dialog__meta">
            <li>
              <strong>Risk:</strong> {weed.riskRating ?? 'Unknown'}
            </li>
            {weed.weedStatusVic && (
              <li>
                <strong>Victorian status:</strong> {weed.weedStatusVic}
              </li>
            )}
            {weed.isWons && <li>Weed of National Significance (WoNS)</li>}
            {weed.riskScore != null && (
              <li>
                <strong>Risk score:</strong> {weed.riskScore}
              </li>
            )}
          </ul>
        </div>
        {summary ? (
          <p className="plant-detail-dialog__summary">{summary}</p>
        ) : enrichment === 'loading' ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Loading description…</p>
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
            No public description found for this species yet.
          </p>
        )}
        {link && (
          <p style={{ margin: 'var(--space-md) 0 0', fontSize: '0.88rem' }}>
            <a href={link} target="_blank" rel="noreferrer">
              Learn more (Wikipedia / species database) →
            </a>
          </p>
        )}
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 'var(--space-md) 0 0' }}>
          Risk metadata is from your weeds database. Photos and short descriptions may come from
          Wikipedia and iNaturalist.
        </p>
      </div>
    </div>
  )
}

// ── Disposal data types ────────────────────────────────────────────────────
type DisposalSpecies = {
  emoji: string; name: string; latin: string
  statusTag: 'prohibited' | 'restricted'; statusLabel: string
  ariTag: 'veryhigh' | 'high'; ariLabel: string; impact: string
  imgUrl?: string
}
type DisposalEntry = {
  title: string; species: DisposalSpecies[]
  risk: string[]; dos: string[]; donts: string[]
  prohibitedNote?: string
}

const DISPOSAL_DATA: Record<WeedCategory, DisposalEntry> = {
  aquatic: {
    title: 'Aquatic & Wetland Herbaceous — Disposal Guide',
    species: [
      { emoji: '🌿', name: 'Alligator Weed', latin: 'Alternanthera philoxeroides', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Alternanthera_philoxeroides_NRCS-1.jpg/330px-Alternanthera_philoxeroides_NRCS-1.jpg', impact: 'Invades both land and water. Stem fragments carried downstream root and form new colonies. Can block entire waterways within one growing season. Do NOT attempt removal — report immediately.' },
      { emoji: '🌱', name: 'Salvinia (Giant Salvinia)', latin: 'Salvinia molesta', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Salvinia_molesta.jpg/330px-Salvinia_molesta.jpg', impact: 'A single plant can cover an entire dam in one season. Blocks light and depletes oxygen, causing fish kills. Illegal to buy, sell, or move in Victoria.' },
      { emoji: '🦆', name: 'Lagarosiphon', latin: 'Lagarosiphon major', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Lagarosiphon_major._Howardian%2C_1992_%2830491279833%29.jpg/330px-Lagarosiphon_major._Howardian%2C_1992_%2830491279833%29.jpg', impact: '"Chokes" slow-moving water bodies, causing anoxia and fish death. Boat propellers and fishing gear carry stem fragments between water bodies.' },
    ],
    risk: ['Even tiny plant fragments can root and establish new colonies downstream', 'Spreads rapidly through waterways, floods, boats, and fishing equipment', 'Removing plants in water can disturb fragments and worsen spread', 'Some species can cover an entire water body within a single growing season'],
    dos: ['Avoid disturbing the water and surrounding vegetation', 'Isolate the affected area where possible to prevent further spread', 'Clean all equipment, boots, and tools thoroughly before leaving the site', 'Monitor nearby drains and waterways for new growth', 'Report any suspected high-risk species to authorities promptly'],
    donts: ['Do not pull, cut, or break plants while they are in the water', 'Do not transport any plant material away from the site', 'Do not dump removed material near drains, waterways, or moist soil'],
    prohibitedNote: 'If you suspect a State Prohibited species such as Salvinia or Alligator Weed — report it immediately. Do not attempt to handle or remove it yourself.',
  },
  riparian: {
    title: 'Riparian Woody Plants — Disposal Guide',
    species: [{ emoji: '🌳', name: 'Willows', latin: 'Salix spp.', statusTag: 'restricted', statusLabel: 'Restricted Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Salix_alba_Morton.jpg/330px-Salix_alba_Morton.jpg', impact: 'Branches dropped into waterways root downstream, spreading infestation along river corridors. Dense stands alter water flow and destabilise banks when removed without a revegetation plan.' }],
    risk: ['Branches and fragments falling into water can root and spread downstream', 'Dense stands alter riverbank stability, water flow, and erosion patterns', 'Cut stumps readily resprout if not treated immediately', 'Large-scale removal without revegetation can destabilise banks'],
    dos: ['Remove in stages — never clear entire riverbanks in a single operation', 'Keep all cut material well away from the water\'s edge', 'Use targeted cut-and-treat methods to minimise regrowth', 'Replant with native vegetation to restore bank stability after clearing', 'Monitor regrowth and signs of erosion regularly'],
    donts: ['Do not drop branches or cuttings into the waterway', 'Do not clear entire riverbanks at once — work in sections', 'Do not leave cut material piled near the water where it can wash in'],
  },
  woody: {
    title: 'Terrestrial Woody Shrubs & Trees — Disposal Guide',
    species: [
      { emoji: '🍇', name: 'Blackberry', latin: 'Rubus fruticosus agg.', statusTag: 'restricted', statusLabel: 'Regionally Controlled / Restricted (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Blackberry_%28Rubus_fruticosus%29.jpg/330px-Blackberry_%28Rubus_fruticosus%29.jpg', impact: 'Birds and mammals disperse berries widely; canes tip-root wherever they touch the ground. Seed bank persists for years after parent plants are removed.' },
      { emoji: '🌿', name: 'Sweet Pittosporum', latin: 'Pittosporum undulatum', statusTag: 'restricted', statusLabel: 'Environmental Weed (outside its natural range)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Pittosporum_undulatum_fruit.jpg/330px-Pittosporum_undulatum_fruit.jpg', impact: 'Dense canopy and allelopathic leaf litter suppress native understorey regeneration. Expands aggressively via bird-dispersed fruit.' },
    ],
    risk: ['Seeds spread widely via birds and animals, creating new infestations at a distance', 'Dense thickets can completely exclude native understorey vegetation', 'Plants readily regrow from cut stumps or remaining root material', 'Seed banks in the soil can persist and germinate for many years'],
    dos: ['Prioritise fruiting or seed-bearing plants first to reduce further spread', 'Use targeted removal methods suited to the species', 'Bag and dispose of all seeds and fruiting material as general waste — not green waste', 'Restore native vegetation after clearing to suppress re-establishment', 'Revisit the site regularly to address any regrowth'],
    donts: ['Do not leave fruiting branches or canes on the ground — they will establish', 'Do not assume cutting alone is sufficient — roots and stumps must also be treated', 'Do not ignore early regrowth — small plants are far easier to remove'],
  },
  climbers: {
    title: 'Climbers & Creeping Groundcovers — Disposal Guide',
    species: [
      { emoji: '🪴', name: 'English Ivy', latin: 'Hedera helix', statusTag: 'restricted', statusLabel: 'Environmental Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hedera_helix_Dover.jpg/330px-Hedera_helix_Dover.jpg', impact: 'Roots at every stem node; climbs tree trunks and weakens large trees. Bird-dispersed berries and garden dumping create distant infestations.' },
      { emoji: '🌸', name: 'Wandering Trad', latin: 'Tradescantia fluminensis', statusTag: 'restricted', statusLabel: 'Environmental Weed (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Tradescantia_fluminensis_%28Flowers%29.jpg/330px-Tradescantia_fluminensis_%28Flowers%29.jpg', impact: 'Every stem node roots on contact with moist soil. Brush cutters and mowers scatter stem fragments, massively expanding the infestation.' },
    ],
    risk: ['Even very small stem fragments can root rapidly in moist soil', 'Dense mats or climbing growth can smother native ground cover and damage trees', 'Cutting or mowing often increases spread by creating more fragments', 'Complete removal is difficult — infestations typically require repeated treatment'],
    dos: ['Remove small patches carefully by hand to avoid creating fragments', 'Collect all plant material and seal it in bags immediately', 'Use controlled, targeted treatment rather than broad mechanical removal', 'Revisit frequently — regrowth is common and early intervention is more effective'],
    donts: ['Do not mow or slash — this creates fragments and significantly widens the infestation', 'Do not leave any plant fragments behind on moist soil', 'Do not dispose of material in green waste bins or compost — stems can regenerate'],
  },
  grasses: {
    title: 'Grasses & Grass-like — Disposal Guide',
    species: [
      { emoji: '🌾', name: 'Serrated Tussock', latin: 'Nassella trichotoma', statusTag: 'restricted', statusLabel: 'Regionally Prohibited / Restricted (Vic)', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Serrated_tussock.jpg/330px-Serrated_tussock.jpg', impact: 'Seeds dormant in soil for up to 15+ years. Wind-dispersed seeds spread along roads, fence lines, and stock routes. Can dominate a paddock within 7 years.' },
    ],
    risk: ['Grasses can produce thousands of seeds per season, many remaining viable in soil for years', 'Seeds travel easily via wind, animals, clothing, machinery, and contaminated feed or hay', 'Large infestations develop quickly and can dominate entire paddocks or grasslands', 'Flammable dry material significantly increases fire risk in affected areas'],
    dos: ['Act before flowering and seed set — early intervention is far more effective', 'Clean all clothing, footwear, and machinery before leaving any infested area', 'Always work from clean areas into infested areas to avoid spreading seed', 'Restore competitive native or pasture vegetation after treatment', 'Identify and monitor high-risk spread corridors such as roadsides and fence lines'],
    donts: ['Do not work in infested areas during active seed drop periods', 'Do not move soil, hay, or machinery from infested areas without thorough cleaning', 'Do not ignore even small infestations — early action prevents large-scale spread'],
    prohibitedNote: 'If the species is State Prohibited, such as Mexican Feather Grass — report it to the relevant authority. Do not attempt removal yourself.',
  },
  broadleaf: {
    title: 'Non-woody Broadleaf Herbs — Disposal Guide',
    species: [
      { emoji: '🌼', name: 'Hawkweeds', latin: 'Pilosella spp.', statusTag: 'prohibited', statusLabel: 'State Prohibited Weed', ariTag: 'veryhigh', ariLabel: 'ARI: Very High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Hieracium_pilosella_plant.jpg/330px-Hieracium_pilosella_plant.jpg', impact: 'Release allelopathic chemicals that suppress surrounding plants; form dense mats in alpine zones. Wind-dispersed seeds and creeping stolons. Early detection is critical.' },
      { emoji: '🌡', name: 'Tutsan', latin: 'Hypericum androsaemum', statusTag: 'restricted', statusLabel: 'Environmental Weed (Vic)', ariTag: 'high', ariLabel: 'ARI: High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/%28MHNT%29_Hypericum_androsaemum_-_Habit.jpg/330px-%28MHNT%29_Hypericum_androsaemum_-_Habit.jpg', impact: 'Forms dense shade-tolerant thickets in moist forest, suppressing native understorey for years. Berries are toxic to livestock and spread via birds.' },
    ],
    risk: ['Seeds and stolons spread quickly, allowing infestations to escalate from small patches', 'Dense ground cover can develop fast, outcompeting native vegetation', 'Some species release chemicals into the soil that suppress surrounding plants', 'Early-stage invasions can become difficult to control if not addressed promptly'],
    dos: ['Address infestations early while they are still small and manageable', 'Minimise soil disturbance during removal — disturbed soil encourages new germination', 'Monitor treated areas regularly and remove any new seedlings promptly', 'Restore native ground cover after clearing to prevent re-establishment'],
    donts: ['Do not delay removal — small infestations are significantly easier to manage', 'Do not disturb the soil more than necessary during removal', 'Do not leave flowering plants in place — remove before seeds are set and dispersed'],
    prohibitedNote: 'If you suspect a State Prohibited species such as Hawkweed — report it immediately to the relevant authority. Do not attempt to handle or remove it yourself.',
  },
  underground: {
    title: 'Underground Storage Perennials — Disposal Guide',
    species: [
      { emoji: '🌷', name: 'Cape Tulip — One Leaf', latin: 'Moraea flaccida', statusTag: 'restricted', statusLabel: 'Regionally Prohibited / Controlled (Vic)', ariTag: 'high', ariLabel: 'ARI: High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Moraea_viscaria_%285%29.JPG/330px-Moraea_viscaria_%285%29.JPG', impact: 'Dense infestations can exceed 7,000 corms per square metre. Foliage disappears for 5–6 months per year — underground density is easily underestimated.' },
    ],
    risk: ['Underground bulbs, corms, or rhizomes persist in soil long after above-ground removal', 'Soil movement — including digging, mowing, or machinery — can spread underground parts', 'Plants are often invisible during dormant periods, making it easy to underestimate the infestation', 'Effective control requires repeated treatment over multiple growing seasons'],
    dos: ['Treat during the active growth phase when plants are visible and uptake is optimal', 'Avoid unnecessary digging — soil disturbance can spread underground parts', 'Bag and secure all excavated plant material before disposing as general waste', 'Monitor the site across multiple seasons to confirm full eradication'],
    donts: ['Do not move soil from infested areas — it may contain bulbs or corm fragments', 'Do not rely on a single treatment — underground structures require long-term management', 'Do not ignore dormant periods — underground parts remain viable even when foliage is absent'],
  },
  succulents: {
    title: 'Succulents & Cacti — Disposal Guide',
    species: [{ emoji: '🌵', name: 'Wheel Cactus', latin: 'Opuntia robusta', statusTag: 'restricted', statusLabel: 'Regionally Prohibited / Controlled / Restricted (Vic)', ariTag: 'high', ariLabel: 'ARI: High', imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Opuntia_robusta_%28Cactaceae%29.jpg/330px-Opuntia_robusta_%28Cactaceae%29.jpg', impact: 'Detached pads root readily on contact with soil. Glochids (barbed micro-spines) penetrate skin and are nearly impossible to remove without medical assistance.' }],
    risk: ['Detached pads and fragments can root and form new plants within weeks', 'Seeds spread via animals that consume the fruit, potentially over long distances', 'Spines and barbs pose a serious physical injury risk during removal', 'Infestations can persist for decades on rocky or otherwise inaccessible terrain'],
    dos: ['Always wear appropriate protective equipment — gloves, long sleeves, and eye protection', 'Handle all plant parts using tongs or tools — never with bare hands', 'Collect all pads, fragments, and fruit carefully before secure disposal as general waste', 'Check the surrounding area for any dropped fragments after removal', 'Monitor the site over the long term — reinfestation from seed is common'],
    donts: ['Do not leave any pads or fruit on the ground — even small pieces can re-establish', 'Do not handle plants without full protective equipment — injuries may require medical attention', 'Do not transport plant material loosely — all parts must be securely contained'],
  },
}

const WEED_TYPES: { type: WeedCategory; icon: string; label: string; imgUrl: string }[] = [
  { type: 'aquatic',      icon: '💧', label: WEED_DISPOSAL_TYPE_LABELS.aquatic,    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Salvinia_molesta.jpg/330px-Salvinia_molesta.jpg' },
  { type: 'riparian',    icon: '🌊', label: WEED_DISPOSAL_TYPE_LABELS.riparian,    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Salix_alba_Morton.jpg/330px-Salix_alba_Morton.jpg' },
  { type: 'woody',       icon: '🌳', label: WEED_DISPOSAL_TYPE_LABELS.woody,       imgUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Pittosporum_undulatum_fruit.jpg/330px-Pittosporum_undulatum_fruit.jpg' },
  { type: 'climbers',    icon: '🪴', label: WEED_DISPOSAL_TYPE_LABELS.climbers,    imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hedera_helix_Dover.jpg/330px-Hedera_helix_Dover.jpg' },
  { type: 'grasses',     icon: '🌾', label: WEED_DISPOSAL_TYPE_LABELS.grasses,     imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Serrated_tussock.jpg/330px-Serrated_tussock.jpg' },
  { type: 'broadleaf',   icon: '🍃', label: WEED_DISPOSAL_TYPE_LABELS.broadleaf,   imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Hieracium_pilosella_plant.jpg/330px-Hieracium_pilosella_plant.jpg' },
  { type: 'underground', icon: '🥕', label: WEED_DISPOSAL_TYPE_LABELS.underground, imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Moraea_viscaria_%285%29.JPG/330px-Moraea_viscaria_%285%29.JPG' },
  { type: 'succulents',  icon: '🌵', label: WEED_DISPOSAL_TYPE_LABELS.succulents,  imgUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Opuntia_robusta_%28Cactaceae%29.jpg/330px-Opuntia_robusta_%28Cactaceae%29.jpg' },
]

const GENERAL_RULES = [
  { emoji: '🧩', title: "Don't break into pieces", body: 'Breaking plant material can spread seeds, fragments, and root sections that each have the potential to establish new plants. Keep the weed as intact as possible during removal.' },
  { emoji: '📦', title: 'Contain all plant material', body: 'All removed plant material — roots, stems, leaves, seeds — must be placed in sealed heavy-duty bags immediately after removal. Never leave removed material on the ground.' },
  { emoji: '🧼', title: 'Clean tools & shoes', body: 'Seeds and plant fragments can hitch a ride on boots, gloves, and tools. Clean thoroughly before leaving the site to prevent spreading to new areas.' },
  { emoji: '🌱', title: 'Avoid disturbing soil', body: 'Soil disturbance creates open ground ideal for weed germination. Minimise digging and disturbed areas, and consider covering exposed soil with mulch after removal.' },
  { emoji: '📅', title: 'Check again later', body: 'A single treatment is rarely enough. Return to the site after 4–6 weeks to remove any regrowth from missed roots or newly germinated seeds before they set seed.' },
]

export function WeedPage() {
  const location = useLocation()
  const { coords } = useLocationArea()
  const inputId = useId()
  const [state, setState] = useState<AnalysisState>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<{ bytes: number; base64Chars: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [topWeeds, setTopWeeds] = useState<RegionWeed[]>([])
  const [topWeedsLoading, setTopWeedsLoading] = useState(false)
  const [topWeedsError, setTopWeedsError] = useState<string | null>(null)
  const [topWeedsSearch, setTopWeedsSearch] = useState('')
  const [topWeedsOffset, setTopWeedsOffset] = useState(0)
  const [topWeedsHasMore, setTopWeedsHasMore] = useState(false)

  // Prohibited weeds modal
  const [modalWeed, setModalWeed] = useState<StateProhibitedWeed | null>(null)
  // General rules accordion
  const [openRules, setOpenRules] = useState<Set<number>>(new Set())
  // Disposal type selector
  const [selectedType, setSelectedType] = useState<WeedCategory | null>(null)
  const disposalContentRef = useRef<HTMLDivElement>(null)
  // Top-weed detail dialog (mirrors the PlantMe popup)
  const topWeedDialogRef = useRef<HTMLDialogElement>(null)
  const topWeedTitleId = useId()
  const [topWeedDetail, setTopWeedDetail] = useState<RegionWeed | null>(null)
  const openTopWeedDetail = useCallback((w: RegionWeed) => {
    setTopWeedDetail(w)
    topWeedDialogRef.current?.showModal()
  }, [])

  const topWeedsEnriched = useRecommendedPlantEnrichment(
    topWeeds.map((w) => ({
      id: `top-${w.id}`,
      scientificName: w.scientificName,
      commonName: w.commonName,
      family: null,
      description: null,
      imageUrl: null,
    })),
  )

  const topWeedsEnrichBusy = useMemo(
    () => topWeeds.some((w) => topWeedsEnriched[`top-${w.id}`] === 'loading'),
    [topWeeds, topWeedsEnriched],
  )

  /** Scroll only after sidebar / in-page hash navigation — not when top-weed fetch state changes. */
  const lastHashForScrollRef = useRef('')
  const pendingHashScrollRef = useRef<string | null>(null)

  useEffect(() => {
    if (location.pathname !== '/weed') {
      lastHashForScrollRef.current = ''
      pendingHashScrollRef.current = null
      return
    }
    const hash = location.hash
    const raw = hash.replace(/^#/, '').trim()
    if (!raw || hash === lastHashForScrollRef.current) return
    lastHashForScrollRef.current = hash
    pendingHashScrollRef.current = raw
  }, [location.hash, location.pathname])

  useEffect(() => {
    if (location.pathname !== '/weed') return
    const raw = pendingHashScrollRef.current
    if (!raw) return
    if (raw === 'top-weeds' && (topWeedsLoading || topWeedsEnrichBusy)) return

    let cancelled = false
    let innerFrame = 0
    const run = () => {
      if (cancelled) return
      const el = document.getElementById(raw)
      if (!el) return
      scrollElementWithFixedHeader(el, 'smooth')
      pendingHashScrollRef.current = null
    }
    const t = window.setTimeout(run, 0)
    const id0 = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(run)
    })
    return () => {
      cancelled = true
      window.clearTimeout(t)
      cancelAnimationFrame(id0)
      cancelAnimationFrame(innerFrame)
    }
  }, [location.pathname, topWeedsLoading, topWeedsEnrichBusy])

  useEffect(() => {
    queueMicrotask(() => setTopWeedsOffset(0))
  }, [topWeedsSearch])

  useEffect(() => {
    const ac = new AbortController()
    setTopWeedsLoading(true)
    setTopWeedsError(null)
    fetchTopWeeds(ac.signal, { pageSize: TOP_WEEDS_PAGE_SIZE, offset: topWeedsOffset, q: topWeedsSearch })
      .then((res) => {
        if (ac.signal.aborted) return
        setTopWeeds(res.weeds)
        setTopWeedsHasMore(res.hasMore)
      })
      .catch((e) => {
        if (ac.signal.aborted) return
        setTopWeedsError(e instanceof Error ? e.message : 'Could not load top weeds')
        setTopWeeds([])
        setTopWeedsHasMore(false)
      })
      .finally(() => {
        if (!ac.signal.aborted) setTopWeedsLoading(false)
      })
    return () => ac.abort()
  }, [topWeedsOffset, topWeedsSearch])

  useEffect(() => {
    if (!modalWeed) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalWeed(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [modalWeed])

  const toggleRule = (i: number) => {
    setOpenRules((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  const handleTypeSelect = (type: WeedCategory) => {
    setSelectedType(type)
    setTimeout(() => disposalContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleOpenDisposalGuide = useCallback((type: WeedCategory) => {
    setSelectedType(type)
    requestAnimationFrame(() => {
      document.getElementById('disposal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        disposalContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    })
  }, [])

  const matchedStateProhibitedWeed = useMemo(() => {
    if (!result?.label) return null
    return matchStateProhibitedWeed(result.label)
  }, [result?.label])

  const handleOpenStateProhibitedWeed = useCallback((weed: StateProhibitedWeed) => {
    setModalWeed(weed)
    requestAnimationFrame(() => {
      document.getElementById('prohibited')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(() => {
        document
          .getElementById(stateProhibitedWeedElementId(weed.id))
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 200)
    })
  }, [])

  const suggestedDisposalCategory = useMemo(() => {
    if (!result || matchedStateProhibitedWeed) return null
    if (!isWeedModelIdentification(result)) return null
    return inferWeedDisposalCategory(null, result.label)
  }, [result, matchedStateProhibitedWeed])

  const handleFile: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState('analyzing')
    setError(null)
    setResult(null)
    setImageInfo(null)
    try {
      const dataUrl = await fileToDataUrl(file)
      setPreviewUrl(dataUrl)

      const base64 = dataUrl.startsWith('data:') ? dataUrl.split(',', 2)[1] ?? '' : dataUrl
      const trimmed = base64.replace(/\s+/g, '').trim()
      if (!trimmed) throw new Error('Could not encode image (empty payload)')

      const pad = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0
      const approxBytes = Math.max(0, Math.floor((trimmed.length * 3) / 4) - pad)
      setImageInfo({ bytes: approxBytes, base64Chars: trimmed.length })

      const pred = await predictPlantFromBase64(trimmed, controller.signal)
      const baseResult: PredictResponse = { ...pred, source: 'model' }

      if (baseResult.confidence < 0.6) {
        try {
          const plantNet = await identifyWithPlantNet(dataUrl, controller.signal)
          setResult(plantNet ?? baseResult)
        } catch {
          setResult(baseResult)
        }
      } else {
        setResult(baseResult)
      }
      setState('done')
    } catch (err) {
      if (controller.signal.aborted) return
      setState('error')
      setError(err instanceof Error ? err.message : 'Prediction failed')
    }
  }

  const showTopWeedsGrid = !topWeedsError && (topWeedsLoading || topWeeds.length > 0)
  const topWeedSlots: (RegionWeed | null)[] = showTopWeedsGrid
    ? Array.from({ length: TOP_WEEDS_PAGE_SIZE }, (_, i) => topWeeds[i] ?? null)
    : []

  return (
    <div className="weed-layout">
      <aside className="weed-sidenav" aria-label="Weed page sections">
        <p className="weed-sidenav__title">On this page</p>
        <a className="weed-sidenav__link" href="#weed-checker">
          Plant identifier
        </a>
        <a className="weed-sidenav__link" href="#top-weeds">
          Top weeds
        </a>
        <a className="weed-sidenav__link" href="#rules">
          General rules
        </a>
        <a className="weed-sidenav__link" href="#disposal">
          Disposal guide
        </a>
        <a className="weed-sidenav__link" href="#prohibited">
          Prohibited weeds
        </a>
      </aside>

      <div className="weed-layout__main">
      <header className="page-header">
          <p className="eyebrow">Weeds</p>
          <h1>Weed help</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            Identify risky plants, reduce spread, and dispose of material responsibly.
        </p>
      </header>

      <Link to="/learn#environmental-weeds" className="weed-learn-link">
        <span className="weed-learn-link__icon"><IconBook /></span>
        <span className="weed-learn-link__text">
          <strong>Why does this matter?</strong> Read{' '}
          <em>Environmental weeds in your garden</em> in Native plants 101.
        </span>
        <span className="weed-learn-link__chev" aria-hidden>&rarr;</span>
      </Link>

      <WeedSection id="weed-checker" title="Plant identifier" eyebrow="Identify">
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-md)' }}>
          Upload a photo or use your camera — we will identify the plant and return a confidence score.
        </p>

      <label htmlFor={inputId} className="upload-zone">
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFile}
        />
        <span className="upload-zone__icon" aria-hidden="true">
          <IconCamera />
        </span>
        <p className="upload-zone__title">Tap to upload or scan a photo</p>
        <p className="upload-zone__hint">JPG or PNG — we will identify the plant and show a confidence score</p>
      </label>

        {previewUrl && (
          <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Selected image</h3>
            <img
              src={previewUrl}
              alt="Uploaded plant preview"
              style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            />
            {imageInfo && (
              <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Payload: ~{Math.round(imageInfo.bytes / 1024)} KB ({imageInfo.base64Chars.toLocaleString()} base64 chars)
              </p>
            )}
          </div>
        )}

      {state === 'analyzing' && (
        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
            Analysing image…
        </p>
      )}

        {state === 'error' && error && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Couldn't analyse that image</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
        )}

        {state === 'done' && result && (
          <PredictionResultCard
            key={result.label}
            result={result}
            matchedStateProhibitedWeed={matchedStateProhibitedWeed}
            suggestedDisposalCategory={suggestedDisposalCategory}
            onOpenDisposalGuide={handleOpenDisposalGuide}
            onOpenStateProhibitedWeed={handleOpenStateProhibitedWeed}
          />
        )}
      </WeedSection>

      <WeedSection id="top-weeds" title="Top weeds (Victoria)">
        <div className="search-field" style={{ marginBottom: 'var(--space-md)' }}>
          <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
            <IconSearch />
          </span>
          <label htmlFor="top-weeds-search" className="sr-only">
            Search top weeds
          </label>
          <input
            id="top-weeds-search"
            type="search"
            placeholder="Search weeds…"
            value={topWeedsSearch}
            onChange={(e) => setTopWeedsSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        {topWeedsError && (
          <div className="card card-body" style={{ borderColor: 'var(--color-danger)' }}>
            <p style={{ margin: 0 }}>{topWeedsError}</p>
          </div>
        )}

        {!topWeedsLoading && !topWeedsError && topWeeds.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No weeds found.</p>
        )}

        {showTopWeedsGrid && (
          <div className="plant-grid plant-grid--top-weeds" style={{ marginTop: 'var(--space-md)' }}>
            {topWeedSlots.map((w, idx) => {
              if (!w) {
                return (
                  <TopWeedPlaceholderSlot
                    key={`tw-slot-${topWeedsOffset}-${idx}`}
                    variant={topWeedsLoading ? 'loading' : 'empty'}
                  />
                )
              }
              const extra = topWeedsEnriched[`top-${w.id}`]
              const meta = typeof extra === 'object' && extra ? extra : undefined
              const img = meta?.imageUrl
              const cardTitle = w.commonName?.trim() || w.scientificName || 'Weed'
              return (
                <button
                  type="button"
                  key={w.id}
                  className="card card-interactive card-media-top top-weed-card"
                  onClick={() => openTopWeedDetail(w)}
                  style={{
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    padding: 0,
                    background: 'var(--color-surface)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="card-media-top__imgwrap">
                    {img ? (
                      <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="vicflora-card__image-placeholder" aria-hidden />
                    )}
                  </div>
                  <div className="card-body top-weed-card__body">
                    <h3 className="top-weed-card__title">{cardTitle}</h3>
                    <div className="top-weed-card__meta">
                      <span>
                        <strong>Risk:</strong> {w.riskRating ?? 'Unknown'}
                      </span>
                    </div>
                    <p className="top-weed-card__cta">View details</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {showTopWeedsGrid && topWeeds.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {topWeedsOffset > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost pagination-step-btn"
                  disabled={topWeedsLoading}
                  onClick={() => setTopWeedsOffset((o) => Math.max(0, o - TOP_WEEDS_PAGE_SIZE))}
                >
                  Previous page
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost pagination-step-btn"
                disabled={!topWeedsHasMore || topWeedsLoading}
                onClick={() => setTopWeedsOffset((o) => o + TOP_WEEDS_PAGE_SIZE)}
              >
                Next page
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
              Page {Math.floor(topWeedsOffset / TOP_WEEDS_PAGE_SIZE) + 1}
              {topWeedsSearch.trim() ? ` · filtering “${topWeedsSearch.trim()}”` : ''}
            </p>
          </div>
        )}
      </WeedSection>

      {/* ── General rules ── */}
      <WeedSection id="rules" title="General rules" eyebrow="Always apply">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {GENERAL_RULES.map((rule, i) => {
            const open = openRules.has(i)
            return (
              <div
                key={i}
                className={`weed-rules-accordion-item${open ? ' weed-rules-accordion-item--open' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleRule(i)}
                  className="weed-rules-accordion-item__trigger"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    background: 'var(--color-surface)',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{rule.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)' }}>{rule.title}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition)' }}>▼</span>
                </button>
                {open && (
                  <div style={{ padding: 'var(--space-md) var(--space-md) var(--space-md) calc(1.25rem + var(--space-md) + var(--space-md))', fontSize: '0.875rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', lineHeight: 1.7 }}>
                    {rule.body}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </WeedSection>

      {/* ── Disposal guide ── */}
      <WeedSection id="disposal" title="Disposal guide by weed type" eyebrow="Dispose responsibly">
        <div className="weed-disposal-type-grid">
          {WEED_TYPES.map(({ type, icon, label, imgUrl }) => {
            const active = selectedType === type
            return (
              <button
                key={type}
                type="button"
                className={`weed-disposal-type-btn${active ? ' weed-disposal-type-btn--active' : ''}`}
                onClick={() => handleTypeSelect(type)}
                style={{
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                <div className="weed-disposal-type-btn__media">
                  <img
                    src={imgUrl}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget
                      img.style.display = 'none'
                      const fb = img.nextElementSibling as HTMLElement | null
                      if (fb) fb.style.display = 'flex'
                    }}
                  />
                  <div className="weed-disposal-type-btn__media-fallback">{icon}</div>
                </div>
                <div className="weed-disposal-type-btn__label-wrap">
                  <span className="weed-disposal-type-btn__label">{label}</span>
                </div>
              </button>
            )
          })}
        </div>
        {selectedType && (() => {
          const d = DISPOSAL_DATA[selectedType]
          return (
            <div ref={disposalContentRef} style={{ marginTop: 'var(--space-xl)', scrollMarginTop: 'var(--space-xl)' }}>
              <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-lg)', fontSize: '1.1rem' }}>{d.title}</h3>
              <div className="weed-disposal-columns" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ background: 'rgba(230,81,0,0.06)', border: '1px solid rgba(230,81,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>⚡ What makes it risky</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {d.risk.map((item, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}><span style={{ flexShrink: 0, color: 'var(--color-warning)', fontWeight: 700, marginTop: 1 }}>•</span>{item}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>✓ What to do</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {d.dos.map((item, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}><span style={{ flexShrink: 0, color: 'var(--color-success)', marginTop: 1 }}>✓</span>{item}</li>)}
                  </ul>
                </div>
                <div style={{ background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-danger)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>✗ What NOT to do</h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {d.donts.map((item, i) => <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}><span style={{ flexShrink: 0, color: 'var(--color-danger)', fontWeight: 700, marginTop: 1 }}>✗</span>{item}</li>)}
                  </ul>
                </div>
              </div>
              {d.prohibitedNote && (
                <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)', background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                  <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🚫</span>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-danger)', lineHeight: 1.6 }}>
                    <strong>{d.prohibitedNote}</strong>
                  </p>
                </div>
              )}
              <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', margin: '0 0 var(--space-sm)' }}>Representative Species</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-md)' }}>
                {d.species.map((s) => (
                  <div key={s.name} className="card" style={{ overflow: 'hidden' }}>
                    {/* Species photo */}
                    <div style={{ position: 'relative', height: 140, background: 'linear-gradient(135deg, var(--color-bg) 0%, rgba(165,214,167,0.4) 100%)' }}>
                      {s.imgUrl ? (
                        <>
                          <img src={s.imgUrl} alt={s.name} loading="lazy" referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={(e) => { const img = e.currentTarget; img.style.display = 'none'; const fb = img.nextElementSibling as HTMLElement | null; if (fb) fb.style.display = 'flex' }}
                          />
                          <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>{s.emoji}</div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem' }}>{s.emoji}</div>
                      )}
                    </div>
                    {/* Species info */}
                    <div style={{ padding: 'var(--space-md)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 2 }}>{s.name}</div>
                      <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>{s.latin}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                        <span className={`badge ${s.statusTag === 'prohibited' ? 'badge-high' : 'badge-medium'}`}>{s.statusLabel}</span>
                        <span className={`badge ${s.ariTag === 'veryhigh' ? 'badge-high' : 'badge-medium'}`}>{s.ariLabel}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--color-text-muted)', lineHeight: 1.65, borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)' }}>{s.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </WeedSection>

      {/* ── Prohibited weeds ── */}
      <WeedSection id="prohibited" title="State prohibited weeds" eyebrow="Do not remove yourself">
        <div style={{ background: 'rgba(230,81,0,0.07)', border: '1px solid rgba(230,81,0,0.22)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <span style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: 2 }}>⚠️</span>
          <div>
            <h3 style={{ color: '#92400e', marginBottom: 'var(--space-xs)', fontSize: '1rem' }}>Can I remove this weed myself?</h3>
            <p style={{ fontSize: '0.88rem', color: '#78350f', margin: 0 }}>
              The following weeds are <strong>State Prohibited Weeds</strong> in Victoria. You must <strong>not</strong> attempt to remove them yourself — report them to the Department of Energy, Environment and Climate Action immediately.
            </p>
            <a
              href={VIC_STATE_PROHIBITED_WEED_REPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="weed-report-cta"
            >
              Report a State Prohibited Weed →
            </a>
          </div>
        </div>
        <div className="weed-prohibited-grid">
          {STATE_PROHIBITED_WEEDS.map((w) => (
            <button
              key={w.id}
              id={stateProhibitedWeedElementId(w.id)}
              type="button"
              className="weed-prohibited-card"
              onClick={() => setModalWeed(w)}
            >
              <div className="weed-prohibited-card__media">
                <img
                  src={w.imgUrl}
                  alt={w.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget
                    img.style.display = 'none'
                    const fb = img.nextElementSibling as HTMLElement | null
                    if (fb) fb.style.display = 'flex'
                  }}
                />
                <div className="weed-prohibited-card__media-fallback">{w.emoji}</div>
              </div>
              <div className="weed-prohibited-card__body">
                <div className="weed-prohibited-card__name">{w.name}</div>
                {w.chinese ? <div className="weed-prohibited-card__sub">{w.chinese}</div> : null}
              </div>
            </button>
          ))}
        </div>
      </WeedSection>

        <footer
        style={{
          marginTop: 'var(--space-xl)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}
      >
        Content adapted from{' '}
        <a href="https://weeds.org.au/" target="_blank" rel="noreferrer">Weeds Australia</a>
        {' '}and{' '}
        <a href="https://agriculture.vic.gov.au/biosecurity/weeds" target="_blank" rel="noreferrer">Agriculture Victoria</a>.
        </footer>

      {/* ── Top-weed detail dialog (mirrors PlantMe) ── */}
      <dialog
        ref={topWeedDialogRef}
        className="plant-detail-dialog"
        aria-labelledby={topWeedTitleId}
        onClose={() => setTopWeedDetail(null)}
      >
        <div className="plant-detail-dialog__inner">
          <header className="plant-detail-dialog__header">
            <h2 id={topWeedTitleId} className="plant-detail-dialog__title">
              {topWeedDetail?.commonName || topWeedDetail?.scientificName || 'Weed details'}
            </h2>
            <button
              type="button"
              className="plant-detail-dialog__close"
              aria-label="Close"
              onClick={() => topWeedDialogRef.current?.close()}
            >
              ×
            </button>
          </header>
          <div className="plant-detail-dialog__body">
            {topWeedDetail && (
              <TopWeedDetailContent
                weed={topWeedDetail}
                enrichment={topWeedsEnriched[`top-${topWeedDetail.id}`]}
              />
            )}
          </div>
        </div>
      </dialog>

      {modalWeed ? <ProhibitedWeedModal weed={modalWeed} onClose={() => setModalWeed(null)} /> : null}
      </div>
    </div>
  )
}
