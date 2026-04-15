import { type ChangeEventHandler, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { IconBin, IconCamera, IconDroplet, IconPrevent } from '../components/Icons'
import { IconSearch } from '../components/Icons'
import type { PlantEnrichment } from '../lib/plantEnrichment'
import { enrichPlantByScientificName } from '../lib/plantEnrichment'
import type { PredictResponse } from '../lib/predict'
import { predictPlantFromBase64 } from '../lib/predict'
import { fetchTopWeeds, type RegionWeed } from '../lib/weedsApi'
import { useRecommendedPlantEnrichment } from '../hooks/useRecommendedPlantEnrichment'
import { ImageLightbox } from '../components/ImageLightbox'

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error'

type ConfidenceTier = 'high' | 'medium' | 'low'

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

function PredictionResultCard({ result }: { result: PredictResponse }) {
  const tier = getConfidenceTier(result.confidence)
  const theme = CONFIDENCE_TIER[tier]
  const pct = Math.round(result.confidence * 10000) / 100
  const barPct = Math.min(100, Math.max(0, result.confidence * 100))

  const [enrichment, setEnrichment] = useState<PlantEnrichment | null>(null)
  const [enrichState, setEnrichState] = useState<'loading' | 'done' | 'error'>('loading')

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
        <h2 style={{ margin: 0, color: theme.accent }}>Likely match</h2>
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
      <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)', fontSize: '1.15rem', color: 'var(--color-text)' }}>
        {result.label}
      </p>
      <p style={{ margin: '0 0 var(--space-md)', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
        {theme.subtitle}
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

      <div
        style={{
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-sm)', color: theme.accent }}>Learn more</h3>
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

      {Array.isArray(result.probabilities) && result.probabilities.length > 0 && (
        <details style={{ marginTop: 'var(--space-md)' }}>
          <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            Show model probabilities
          </summary>
          <pre
            style={{
              marginTop: 'var(--space-sm)',
              background: 'rgba(255,255,255,0.5)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {JSON.stringify(result.probabilities.slice(0, 50), null, 2)}
          </pre>
        </details>
      )}

      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
        Always confirm ID with your state biosecurity resource. This feature uses an ML model and can be wrong.
      </p>
    </div>
  )
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
        scrollMarginTop: 'var(--space-xl)',
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

export function WeedPage() {
  const location = useLocation()
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

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

  useLayoutEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    const el = document.getElementById(raw)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, location.pathname])

  useEffect(() => {
    queueMicrotask(() => setTopWeedsOffset(0))
  }, [topWeedsSearch])

  useEffect(() => {
    const ac = new AbortController()
    setTopWeedsLoading(true)
    setTopWeedsError(null)
    fetchTopWeeds(ac.signal, { pageSize: 12, offset: topWeedsOffset, q: topWeedsSearch })
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
      setResult(pred)
      setState('done')
    } catch (err) {
      if (controller.signal.aborted) return
      setState('error')
      setError(err instanceof Error ? err.message : 'Prediction failed')
    }
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Weeds</p>
        <h1>Weed help</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Identify risky plants, reduce spread, and dispose of material responsibly.
        </p>
      </header>

      <div className="section-block" style={{ marginBottom: 0 }}>
        <h2 className="sr-only">Quick links</h2>
        <div className="feature-grid">
          <a href="#weed-checker" className="feature-tile">
            <div className="feature-tile__icon">
              <IconCamera />
            </div>
            <div>
              <h3>Weed checker</h3>
              <p>Scan or upload a plant to check invasive risk — same as Plant Safety Check on Home.</p>
            </div>
          </a>
          <a href="#prevention" className="feature-tile">
            <div className="feature-tile__icon">
              <IconPrevent />
            </div>
            <div>
              <h3>Weed prevention</h3>
              <p>General tips to stop weeds taking hold in your garden.</p>
            </div>
          </a>
          <a href="#hygiene" className="feature-tile">
            <div className="feature-tile__icon">
              <IconDroplet />
            </div>
            <div>
              <h3>Weed hygiene</h3>
              <p>Stop weeds moving between vehicles, tools, and bushland.</p>
            </div>
          </a>
          <a href="#disposal" className="feature-tile">
            <div className="feature-tile__icon">
              <IconBin />
            </div>
            <div>
              <h3>Safe disposal</h3>
              <p>How to discard weeds and garden waste without spreading them.</p>
            </div>
          </a>
        </div>
      </div>

      <WeedSection id="top-weeds" title="Top weeds (Victoria)" eyebrow="Statewide">
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-md)' }}>
          This is a statewide list from your database (<code>weed_info</code>) sorted by WoNS and risk score. Use the local
          region-linked weeds for postcode-level accuracy once your database contains those links.
        </p>

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
            placeholder="Search statewide weeds…"
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
        {topWeedsLoading && <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Loading top weeds…</p>}

        {!topWeedsLoading && !topWeedsError && topWeeds.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No weeds found.</p>
        )}

        {topWeeds.length > 0 && (
          <div className="plant-grid" style={{ marginTop: 'var(--space-md)' }}>
            {topWeeds.map((w) => {
              const extra = topWeedsEnriched[`top-${w.id}`]
              const meta = typeof extra === 'object' && extra ? extra : undefined
              const img = meta?.imageUrl
              const blurb = meta?.description
              return (
                <div key={w.id} className="card card-interactive card-media-top" style={{ textAlign: 'left' }}>
                  <div className="card-media-top__imgwrap">
                    {img ? (
                      <>
                        <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          className="img-expand-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setLightboxSrc(img)
                          }}
                        >
                          Expand
                        </button>
                      </>
                    ) : (
                      <div className="vicflora-card__image-placeholder" aria-hidden />
                    )}
                  </div>
                  <div className="card-body">
                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{w.commonName || w.scientificName}</h3>
                    {w.commonName && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.86rem', color: 'var(--color-text-muted)' }}>
                        {w.scientificName}
                      </p>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.35rem 0.6rem',
                        marginTop: '0.55rem',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                      }}
                    >
                      <span>
                        <strong>Risk:</strong> {w.riskRating ?? 'Unknown'}
                      </span>
                      {w.isWons && <span style={{ color: 'var(--color-danger)', fontWeight: 800 }}>WoNS</span>}
                      {w.riskScore != null && <span style={{ color: 'var(--color-text-muted)' }}>score {w.riskScore}</span>}
                    </div>
                    {w.weedStatusVic && (
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        {w.weedStatusVic}
                      </p>
                    )}
                    {blurb && (
                      <p
                        style={{
                          margin: '0.6rem 0 0',
                          fontSize: '0.82rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {blurb}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {topWeeds.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={topWeedsOffset <= 0 || topWeedsLoading}
                onClick={() => setTopWeedsOffset((o) => Math.max(0, o - 12))}
              >
                Previous page
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!topWeedsHasMore || topWeedsLoading}
                onClick={() => setTopWeedsOffset((o) => o + 12)}
              >
                Next page
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
              Page {Math.floor(topWeedsOffset / 12) + 1}
              {topWeedsSearch.trim() ? ` · filtering “${topWeedsSearch.trim()}”` : ''}
            </p>
          </div>
        )}
      </WeedSection>

      <ImageLightbox src={lightboxSrc} open={Boolean(lightboxSrc)} onClose={() => setLightboxSrc(null)} />

      <WeedSection id="weed-checker" title="Weed checker" eyebrow="Identify">
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 'var(--space-md)' }}>
          Upload a photo or use your camera — we will identify the plant and return a confidence score.
        </p>

        <label htmlFor={inputId} className="upload-zone" style={{ display: 'block' }}>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFile}
          />
          <IconCamera />
          <p style={{ margin: 'var(--space-sm) 0 0', fontWeight: 600 }}>Tap to upload or scan</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            JPG or PNG — sent to the prediction API
          </p>
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
            <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Couldn’t analyse that image</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
        )}

        {state === 'done' && result && <PredictionResultCard key={result.label} result={result} />}
      </WeedSection>

      <WeedSection id="prevention" title="General weed prevention tips" eyebrow="Stop weeds early">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
          <li>Choose plants that are unlikely to become weeds in your area.</li>
          <li>Check existing garden plants are safe.</li>
          <li>Remove potentially weedy plants.</li>
          <li>Dispose of garden waste carefully.</li>
          <li>Be careful not to spread weeds.</li>
          <li>Place mulch on soil surfaces in the garden to reduce weed growth.</li>
        </ul>
      </WeedSection>

      <WeedSection id="hygiene" title="General weed hygiene tips" eyebrow="Limit spread">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
          <li>
            Inspect vehicles thoroughly — e.g. tyres, mud in wheel arches, guards and mudguards (check panels and
            fairings where relevant).
          </li>
          <li>Carry a brush or broom; simple tools are often the best.</li>
          <li>Carry a sealable bag for weeds and plant material; dispose of it thoroughly according to local rules.</li>
          <li>
            If wash-down is necessary, do it on a tarp in an area that is already weed-infested where possible, and
            watch for runoff.
          </li>
          <li>Be careful with livestock and stock feed (weeds and seeds can hitchhike).</li>
          <li>Check your socks and trouser cuffs for seeds and fragments.</li>
        </ul>
      </WeedSection>

      <WeedSection id="disposal" title="General safe weed disposal tips" eyebrow="Dispose responsibly">
        <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
          <li>
            Use council green-waste bins or drop-off days where allowed — follow your council’s rules for weeds.
          </li>
          <li>Avoid home compost for weeds with persistent roots, bulbs, or abundant seed.</li>
          <li>Bag and landfill (as local rules require) species that reproduce easily from fragments.</li>
          <li>Check state and council lists for <strong>declared</strong> or <strong>noxious</strong> species — disposal may be mandatory.</li>
          <li>Never burn weeds without knowing fire regulations and smoke impacts in your area.</li>
        </ul>
        <p style={{ margin: 'var(--space-md) 0 0', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
          For authoritative rules, use your state agriculture or biosecurity website and local council.
        </p>
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
        Content on this page adapted from{' '}
        <a href="https://weeds.org.au/" target="_blank" rel="noreferrer">
          Weeds Australia
        </a>
        .
      </footer>
    </>
  )
}
