import { useCallback, useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { IconSearch } from '../components/Icons'
import { LocationPromptBanner } from '../components/LocationPromptBanner'
import { SeedSproutIcon } from '../components/SeedSproutIcon'
import { WildlifeFilter } from '../components/WildlifeFilter'
import { useLocationArea } from '../context/LocationContext'
import { useSeedCart } from '../context/useSeedCart'
import {
  fetchRecommendations,
  WILDLIFE_CATEGORY_OPTIONS,
  type RecommendedPlant,
  type WildlifeCategory,
} from '../lib/recommendationsApi'
import { fetchPlantDetail, type PlantDetail } from '../lib/plantDetailsApi'
import { visualForType, WILDLIFE_VISUALS } from '../lib/wildlifeVisuals'
import {
  useRecommendedPlantEnrichment,
  type EnrichmentState,
} from '../hooks/useRecommendedPlantEnrichment'
const RDS_PAGE_SIZE = 12

const WILDLIFE_CATEGORY_IDS = WILDLIFE_CATEGORY_OPTIONS.map((o) => o.id)

const LF_CODE_OPTIONS = [
  { code: 'MS', label: 'Medium Shrub' },
  { code: 'SS', label: 'Small Shrub' },
  { code: 'T', label: 'Tree' },
  { code: 'MH', label: 'Medium Herb' },
  { code: 'PS', label: 'Prostrate Shrub' },
  { code: 'SH', label: 'Small Herb' },
  { code: 'GF', label: 'Ground Fern' },
  { code: 'LH', label: 'Large Herb' },
  { code: 'EP', label: 'Epiphyte' },
  { code: 'MTG', label: 'Medium Tufted Grass' },
  { code: 'SC', label: 'Scrambler / Climber' },
  { code: 'LTG', label: 'Large Tufted Grass' },
  { code: 'MNG', label: 'Medium Non-tufted Grass' },
  { code: 'LNG', label: 'Large Non-tufted Grass' },
  { code: 'TTG', label: 'Tiny Tufted Grass' },
  { code: 'HG', label: 'Herbaceous Groundcover' },
] as const

function lfCodeLabel(code: string | null | undefined): string | null {
  if (!code) return null
  const match = LF_CODE_OPTIONS.find((o) => o.code === code)
  return match ? match.label : code
}

function parseWildlifeParam(raw: string | null): WildlifeCategory[] {
  if (!raw) return []
  const known = new Set<WildlifeCategory>(WILDLIFE_CATEGORY_IDS)
  const seen = new Set<WildlifeCategory>()
  const out: WildlifeCategory[] = []
  for (const piece of raw.split(',')) {
    const v = piece.trim().toLowerCase() as WildlifeCategory
    if (!known.has(v) || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out
}


/**
 * Bookmark toggle button rendered as a sibling overlay (not a child) of the plant
 * card. The card itself is a `<button>`; nesting another button is invalid HTML,
 * so the parent grid cell becomes `position: relative` and this lives next to it.
 */
function SeedCartBookmarkButton({
  plant,
  imageForCart,
}: {
  plant: RecommendedPlant
  imageForCart: string | null
}) {
  const { isInCart, toggle } = useSeedCart()
  const saved = isInCart(plant.id)
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    toggle({
      id: plant.id,
      scientificName: plant.scientificName,
      commonName: plant.commonName,
      imageUrl: imageForCart,
      lfCode: plant.lfCode ?? null,
    })
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from seed cart' : 'Add to seed cart'}
      title={saved ? 'Saved · click to remove' : 'Add to seed cart'}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
        width: 40,
        height: 40,
        borderRadius: 999,
        border: '1px solid rgba(0,0,0,0.08)',
        background: saved ? 'var(--color-primary)' : 'rgba(255,255,255,0.94)',
        color: saved ? '#fff' : 'var(--color-primary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: saved
          ? '0 2px 8px rgba(46, 125, 50, 0.35)'
          : '0 1px 3px rgba(0,0,0,0.18)',
        padding: 0,
        transition: 'background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease',
      }}
    >
      <SeedSproutIcon saved={saved} size={24} burst />
    </button>
  )
}

function RdsPlantCard({
  plant,
  enrichment,
  onOpen,
}: {
  plant: RecommendedPlant
  enrichment?: EnrichmentState
  onOpen: (p: RecommendedPlant) => void
}) {
  const displayName = plant.commonName?.trim() || plant.scientificName || 'Plant'
  const extra =
    typeof enrichment === 'object' && enrichment !== null ? enrichment : undefined
  const imageSrc = plant.imageUrl?.trim() || extra?.imageUrl

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
      <div className="card-body catalog-card__body" style={{ flex: 1, textAlign: 'left' }}>
        <h3 className="plant-card-title">{displayName}</h3>
        <p className="catalog-card__cta">View details</p>
      </div>
    </button>
  )
}

type DetailFetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; detail: PlantDetail }
  | { status: 'error'; message: string }

function WildlifeSection({ state }: { state: DetailFetchState }) {
  if (state.status === 'loading') {
    return (
      <section
        className="plant-detail-dialog__wildlife"
        aria-labelledby="plant-detail-wildlife-heading"
        style={{ marginTop: 'var(--space-md)' }}
      >
        <h3
          id="plant-detail-wildlife-heading"
          style={{ fontSize: '0.95rem', margin: '0 0 var(--space-sm)' }}
        >
          Attracts wildlife
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Loading wildlife info…
        </p>
      </section>
    )
  }
  if (state.status !== 'ready') return null
  const groups = state.detail.wildlifeAttracted
  if (groups.length === 0) return null
  return (
    <section
      className="plant-detail-dialog__wildlife"
      aria-labelledby="plant-detail-wildlife-heading"
      style={{ marginTop: 'var(--space-md)' }}
    >
      <h3
        id="plant-detail-wildlife-heading"
        style={{ fontSize: '0.95rem', margin: '0 0 var(--space-sm)' }}
      >
        Attracts wildlife
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-sm)' }}>
        {groups.map((g) => {
          const visual = visualForType(g.type)
          const Icon = visual?.Icon ?? null
          return (
            <li
              key={g.type}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                columnGap: '0.6rem',
                alignItems: 'start',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: visual
                    ? `color-mix(in srgb, ${visual.color} 14%, transparent)`
                    : 'var(--color-surface-muted, rgba(0,0,0,0.05))',
                  color: visual?.color ?? 'var(--color-text-muted)',
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                {Icon ? <Icon size={18} /> : null}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>{g.type}</p>
                {g.species.length > 0 && (
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-text-muted)',
                      margin: '0.1rem 0 0',
                    }}
                  >
                    {g.species.join(' · ')}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function DbPlantDetailContent({
  plant,
  enrichment,
  detail,
}: {
  plant: RecommendedPlant
  enrichment?: EnrichmentState
  detail: DetailFetchState
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
    <div className="plant-detail-dialog__content">
      {hero && (
        <div className="plant-detail-dialog__hero">
          <img src={hero} alt="" loading="lazy" />
        </div>
      )}
      <div className="plant-detail-dialog__details">
        <div className="plant-detail-dialog__intro">
          <p className="plant-detail-dialog__primary">{primaryTitle}</p>
          {common && sci && common.toLowerCase() !== sci.toLowerCase() && (
            <p className="plant-detail-dialog__sci">{sci}</p>
          )}
          {(plant.family || plant.lfCode) && (
            <ul className="plant-detail-dialog__meta">
              {plant.family && <li>Family: {plant.family}</li>}
              {plant.lfCode && <li>Plant type: {lfCodeLabel(plant.lfCode)}</li>}
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

        <WildlifeSection state={detail} />
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 'var(--space-md) 0 0' }}>
          Short descriptions and photos may come from Wikipedia and iNaturalist when not stored in your database.
        </p>
      </div>
    </div>
  )
}

function SeedCartHeaderLink() {
  const { count, totalQuantity } = useSeedCart()
  const badge = totalQuantity > 0 ? totalQuantity : count
  const hasItems = badge > 0
  return (
    <Link
      to="/seed-cart"
      className="btn btn-ghost"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        padding: '0.5rem 0.85rem',
        fontSize: '1rem',
        fontWeight: 600,
      }}
      aria-label={`Open seed cart (${badge} item${badge === 1 ? '' : 's'})`}
    >
      <SeedSproutIcon saved={hasItems} size={26} />
      <span>Seed cart</span>
      <span
        aria-hidden
        style={{
          minWidth: 26,
          padding: '0 0.45rem',
          height: 26,
          borderRadius: 999,
          background: 'var(--color-primary)',
          color: '#fff',
          fontSize: '0.88rem',
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {badge}
      </span>
    </Link>
  )
}

function SeedCartDetailButton({
  plant,
  imageForCart,
}: {
  plant: RecommendedPlant
  imageForCart: string | null
}) {
  const { isInCart, toggle } = useSeedCart()
  const saved = isInCart(plant.id)
  return (
    <button
      type="button"
      className={saved ? 'btn btn-ghost' : 'btn btn-primary'}
      onClick={() =>
        toggle({
          id: plant.id,
          scientificName: plant.scientificName,
          commonName: plant.commonName,
          imageUrl: imageForCart,
          lfCode: plant.lfCode ?? null,
        })
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: 'var(--space-md)',
      }}
      aria-pressed={saved}
    >
      <SeedSproutIcon saved={saved} size={22} burst />
      <span>{saved ? 'Saved to seed cart' : 'Add to seed cart'}</span>
    </button>
  )
}

export function PlantSearchPage() {
  const { coords } = useLocationArea()
  const [searchParams, setSearchParams] = useSearchParams()
  const wildlife = useMemo(
    () => parseWildlifeParam(searchParams.get('wildlife')),
    [searchParams],
  )
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
  const [detailState, setDetailState] = useState<DetailFetchState>({ status: 'idle' })

  const openDbPlantDetail = useCallback((plant: RecommendedPlant) => {
    setDbPlantDetail(plant)
    requestAnimationFrame(() => plantDetailDialogRef.current?.showModal())
  }, [])

  const handleWildlifeChange = useCallback(
    (next: WildlifeCategory[]) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev)
          if (next.length === 0) sp.delete('wildlife')
          else sp.set('wildlife', next.join(','))
          return sp
        },
        { replace: false },
      )
    },
    [setSearchParams],
  )

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
      fetchRecommendations(lat, lng, ac.signal, {
        pageSize: RDS_PAGE_SIZE,
        offset: rdsOffset,
        q: rdsSearch,
        wildlife,
      })
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
  }, [coords, rdsOffset, rdsSearch, wildlife])

  // When filters change, jump back to the first page.
  const lastResetKey = useRef<string>('')
  useEffect(() => {
    const key = `${rdsSearch}::${wildlife.join(',')}`
    if (lastResetKey.current === key) return
    lastResetKey.current = key
    queueMicrotask(() => setRdsOffset(0))
  }, [rdsSearch, wildlife])

  useEffect(() => {
    if (!dbPlantDetail) return
    const ac = new AbortController()
    queueMicrotask(() => {
      if (ac.signal.aborted) return
      setDetailState({ status: 'loading' })
      fetchPlantDetail(dbPlantDetail.id, ac.signal)
        .then((detail) => {
          if (ac.signal.aborted) return
          if (!detail) {
            setDetailState({
              status: 'ready',
              detail: {
                id: dbPlantDetail.id,
                scientificName: dbPlantDetail.scientificName,
                commonName: dbPlantDetail.commonName,
                wildlifeAttracted: [],
              },
            })
          } else {
            setDetailState({ status: 'ready', detail })
          }
        })
        .catch((e) => {
          if (ac.signal.aborted) return
          setDetailState({
            status: 'error',
            message: e instanceof Error ? e.message : 'Could not load plant details',
          })
        })
    })
    return () => ac.abort()
  }, [dbPlantDetail])

  const canPrevRds = rdsOffset > 0
  const canNextRds = rdsHasMore

  const dialogTitle =
    dbPlantDetail?.commonName ||
    dbPlantDetail?.scientificName ||
    'Plant details'

  return (
    <>
      <header
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="eyebrow">PlantMe</p>
          <h1 style={{ margin: 0 }}>Search plants</h1>
        </div>
        <SeedCartHeaderLink />
      </header>

      <p
        style={{
          margin: '0 0 var(--space-md)',
          maxWidth: '40rem',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          color: 'var(--color-text-muted)',
        }}
      >
        Save plants to your seed cart — you can place them in the garden planner, or print a list to take to the nursery.
      </p>

      <LocationPromptBanner surface="plantme" />

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

        <div className="search-field" style={{ marginBottom: 'var(--space-sm)' }}>
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

        <WildlifeFilter
          value={wildlife}
          onChange={handleWildlifeChange}
          disabled={rdsLoading && rdsPlants.length === 0}
          className="rds-wildlife-filter"
        />
        <div className="plant-grid">
          {rdsPlants.map((p) => {
            const enrichment = rdsEnriched[p.id]
            const extra =
              typeof enrichment === 'object' && enrichment !== null ? enrichment : undefined
            const imageForCart = p.imageUrl?.trim() || extra?.imageUrl || null
            return (
              <div key={p.id} style={{ position: 'relative', display: 'flex' }}>
                <RdsPlantCard
                  plant={p}
                  enrichment={enrichment}
                  onOpen={openDbPlantDetail}
                />
                <SeedCartBookmarkButton plant={p} imageForCart={imageForCart} />
              </div>
            )
          })}
        </div>

        {coords && !rdsError && rdsPlants.length > 0 && (
          <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {canPrevRds && (
                <button
                  type="button"
                  className="btn btn-ghost pagination-step-btn"
                  disabled={rdsLoading}
                  onClick={() => setRdsOffset((o) => Math.max(0, o - RDS_PAGE_SIZE))}
                >
                  Previous page
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost pagination-step-btn"
                disabled={!canNextRds || rdsLoading}
                onClick={() => setRdsOffset((o) => o + RDS_PAGE_SIZE)}
              >
                Next page
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
              Page {Math.floor(rdsOffset / RDS_PAGE_SIZE) + 1}
              {rdsSearch.trim() ? ` · search “${rdsSearch.trim()}”` : ''}
              {wildlife.length
                ? ` · for ${wildlife.map((id) => WILDLIFE_VISUALS[id].label.toLowerCase()).join(', ')}`
                : ''}
            </p>
          </div>
        )}

        {!rdsLoading && coords && !rdsError && rdsPlants.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-lg)' }}>
            {wildlife.length || rdsSearch.trim()
              ? 'No plants match your filters. Try another visitor (birds, insects, mammals) or clear the search.'
              : 'No plants returned for this point. Check bioregion–plant links in the database, or widen your dataset.'}
          </p>
        )}
      </section>

      <dialog
        ref={plantDetailDialogRef}
        className="plant-detail-dialog"
        aria-labelledby={plantDetailTitleId}
        onClose={() => {
          setDbPlantDetail(null)
          setDetailState({ status: 'idle' })
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
              <>
                <DbPlantDetailContent
                  plant={dbPlantDetail}
                  enrichment={rdsEnriched[dbPlantDetail.id]}
                  detail={detailState}
                />
                {(() => {
                  const enr = rdsEnriched[dbPlantDetail.id]
                  const extra = typeof enr === 'object' && enr !== null ? enr : undefined
                  const imageForCart =
                    dbPlantDetail.imageUrl?.trim() || extra?.imageUrl || null
                  return (
                    <SeedCartDetailButton
                      plant={dbPlantDetail}
                      imageForCart={imageForCart}
                    />
                  )
                })()}
              </>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
