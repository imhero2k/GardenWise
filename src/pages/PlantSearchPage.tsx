import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { IconSearch } from '../components/Icons'
import { useLocationArea } from '../context/LocationContext'
import {
  fetchRecommendations,
  type RecommendedPlant,
} from '../lib/recommendationsApi'
import {
  useRecommendedPlantEnrichment,
  type EnrichmentState,
} from '../hooks/useRecommendedPlantEnrichment'
const RDS_PAGE_SIZE = 12

function RdsPlantCard({
  plant,
  enrichment,
  onOpen,
}: {
  plant: RecommendedPlant
  enrichment?: EnrichmentState
  onOpen: (p: RecommendedPlant) => void
}) {
  const common = plant.commonName?.trim()
  const sci = plant.scientificName
  const primaryTitle = common || sci || 'Plant'
  const showScientificLine =
    Boolean(common && sci && common.toLowerCase() !== sci.toLowerCase())
  const extra =
    typeof enrichment === 'object' && enrichment !== null ? enrichment : undefined
  const imageSrc = plant.imageUrl?.trim() || extra?.imageUrl
  const blurb = plant.description?.trim() || extra?.description || null
  const loadingBlurb = enrichment === 'loading' && !blurb

  return (
    <button
      type="button"
      className="card card-interactive vicflora-card"
      onClick={() => onOpen(plant)}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      <div className="plant-card-image-wrap vicflora-card__image">
        {imageSrc ? (
          <img src={imageSrc} alt="" loading="lazy" />
        ) : (
          <div className="vicflora-card__image-placeholder" aria-hidden />
        )}
      </div>
      <div className="card-body" style={{ flex: 1, textAlign: 'left' }}>
        <h3 className="plant-card-title">{primaryTitle}</h3>
        {showScientificLine && <p className="plant-card-sci">{sci}</p>}
        {plant.family && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
            Family: {plant.family}
          </p>
        )}
        {loadingBlurb && (
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
            Loading description…
          </p>
        )}
        {blurb && (
          <p
            className="rds-plant-card__blurb"
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              margin: 'var(--space-sm) 0 0',
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
        <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', margin: 'var(--space-sm) 0 0' }}>
          View details
        </p>
      </div>
    </button>
  )
}

function DbPlantDetailContent({
  plant,
  enrichment,
}: {
  plant: RecommendedPlant
  enrichment?: EnrichmentState
}) {
  const common = plant.commonName?.trim()
  const sci = plant.scientificName
  const primaryTitle = common || sci || 'Plant'
  const extra =
    typeof enrichment === 'object' && enrichment !== null ? enrichment : undefined
  const hero = plant.imageUrl?.trim() || extra?.imageUrl
  const summary = plant.description?.trim() || extra?.description
  const link = plant.externalLinkUrl?.trim() || extra?.linkUrl

  return (
    <>
      {hero && (
        <div className="plant-detail-dialog__hero">
          <img src={hero} alt="" loading="lazy" />
        </div>
      )}
      <div className="plant-detail-dialog__intro">
        <p className="plant-detail-dialog__primary">{primaryTitle}</p>
        {common && sci && common.toLowerCase() !== sci.toLowerCase() && (
          <p className="plant-detail-dialog__sci">{sci}</p>
        )}
        {plant.family && (
          <ul className="plant-detail-dialog__meta">
            <li>Family: {plant.family}</li>
          </ul>
        )}
      </div>
      {summary ? (
        <p className="plant-detail-dialog__summary">{summary}</p>
      ) : enrichment === 'loading' ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Loading description…</p>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
          No description found for this species yet.
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
        Short descriptions and photos may come from Wikipedia and iNaturalist when not stored in your database.
      </p>
    </>
  )
}

export function PlantSearchPage() {
  const { coords } = useLocationArea()
  const [rdsPlants, setRdsPlants] = useState<RecommendedPlant[]>([])
  const [rdsRegionName, setRdsRegionName] = useState<string | null>(null)
  const [rdsSearch, setRdsSearch] = useState('')
  const [rdsOffset, setRdsOffset] = useState(0)
  const [rdsLoading, setRdsLoading] = useState(false)
  const [rdsHasMore, setRdsHasMore] = useState(false)
  const [rdsError, setRdsError] = useState<string | null>(null)
  const rdsEnriched = useRecommendedPlantEnrichment(rdsPlants)

  const plantDetailDialogRef = useRef<HTMLDialogElement>(null)
  const plantDetailTitleId = useId()
  const [dbPlantDetail, setDbPlantDetail] = useState<RecommendedPlant | null>(null)

  const openDbPlantDetail = useCallback((plant: RecommendedPlant) => {
    setDbPlantDetail(plant)
    plantDetailDialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (!coords) {
      queueMicrotask(() => {
        setRdsLoading(false)
        setRdsPlants([])
        setRdsRegionName(null)
        setRdsOffset(0)
        setRdsHasMore(false)
        setRdsError(null)
      })
      return
    }
    const ac = new AbortController()
    const { lat, lng } = coords
    queueMicrotask(() => {
      if (ac.signal.aborted) return
      setRdsLoading(true)
      setRdsError(null)
      fetchRecommendations(lat, lng, ac.signal, { pageSize: RDS_PAGE_SIZE, offset: rdsOffset, q: rdsSearch })
        .then((res) => {
          if (ac.signal.aborted) return
          setRdsPlants(res.plants)
          setRdsHasMore(res.hasMore)
          setRdsRegionName(res.regionName)
        })
        .catch((e) => {
          if (!ac.signal.aborted) {
            setRdsError(e instanceof Error ? e.message : 'Could not load recommendations')
            setRdsPlants([])
            setRdsRegionName(null)
            setRdsHasMore(false)
          }
        })
        .finally(() => {
          if (!ac.signal.aborted) setRdsLoading(false)
        })
    })
    return () => ac.abort()
  }, [coords, rdsOffset, rdsSearch])

  // When search term changes, jump back to the first page.
  useEffect(() => {
    queueMicrotask(() => setRdsOffset(0))
  }, [rdsSearch])
  const canPrevRds = rdsOffset > 0
  const canNextRds = rdsHasMore

  const dialogTitle =
    dbPlantDetail?.commonName ||
    dbPlantDetail?.scientificName ||
    'Plant details'

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">PlantMe</p>
        <h1>Search plants</h1>
      </header>

      <section style={{ marginBottom: 'var(--space-xl)' }} aria-labelledby="rds-heading">
        <h2 id="rds-heading" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>
          Recommended for your location
        </h2>

        {rdsError && (
          <div className="card card-body" style={{ borderColor: 'var(--color-danger)', marginBottom: 'var(--space-md)' }}>
            <p style={{ margin: 0 }}>{rdsError}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
              In the project root, add <code>DATABASE_URL=postgresql://…</code> to <code>.env.local</code> (or{' '}
              <code>.env</code>), restart <code>npm run dev:api</code> (or <code>npm run dev:all</code>), then refresh.
              See <code>.env.example</code>. For production, deploy the API and set <code>VITE_API_BASE_URL</code>.
            </p>
          </div>
        )}

        {rdsLoading && coords && <p style={{ color: 'var(--color-text-muted)' }}>Loading recommendations…</p>}

        {!rdsLoading && coords && !rdsError && rdsRegionName && (
          <p style={{ fontSize: '0.88rem', marginBottom: 'var(--space-md)' }}>
            <strong>Matched region:</strong> {rdsRegionName}
          </p>
        )}

        <div className="search-field" style={{ marginBottom: 'var(--space-md)' }}>
          <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
            <IconSearch />
          </span>
          <label htmlFor="recommended-search" className="sr-only">
            Search
          </label>
          <input
            id="recommended-search"
            type="search"
            placeholder="Search recommendations…"
            value={rdsSearch}
            onChange={(e) => setRdsSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="plant-grid">
          {rdsPlants.map((p) => (
            <RdsPlantCard
              key={p.id}
              plant={p}
              enrichment={rdsEnriched[p.id]}
              onOpen={openDbPlantDetail}
            />
          ))}
        </div>

        {coords && !rdsError && rdsPlants.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!canPrevRds || rdsLoading}
                onClick={() => setRdsOffset((o) => Math.max(0, o - RDS_PAGE_SIZE))}
              >
                Previous page
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!canNextRds || rdsLoading}
                onClick={() => setRdsOffset((o) => o + RDS_PAGE_SIZE)}
              >
                Next page
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
              Page {Math.floor(rdsOffset / RDS_PAGE_SIZE) + 1}
              {rdsSearch.trim() ? ` · filtering “${rdsSearch.trim()}”` : ''}
            </p>
          </div>
        )}

        {!rdsLoading && coords && !rdsError && rdsPlants.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-lg)' }}>
            No plants returned for this point. Check bioregion–plant links in the database, or widen your dataset.
          </p>
        )}
      </section>

      <dialog
        ref={plantDetailDialogRef}
        className="plant-detail-dialog"
        aria-labelledby={plantDetailTitleId}
        onClose={() => {
          setDbPlantDetail(null)
        }}
      >
        <div className="plant-detail-dialog__inner">
          <header className="plant-detail-dialog__header">
            <h2 id={plantDetailTitleId} className="plant-detail-dialog__title">
              {dialogTitle}
            </h2>
            <button
              type="button"
              className="plant-detail-dialog__close"
              aria-label="Close"
              onClick={() => plantDetailDialogRef.current?.close()}
            >
              ×
            </button>
          </header>
          <div className="plant-detail-dialog__body">
            {dbPlantDetail && (
              <DbPlantDetailContent plant={dbPlantDetail} enrichment={rdsEnriched[dbPlantDetail.id]} />
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
