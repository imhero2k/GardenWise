import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { IconSearch } from '../components/Icons'
import { useLocationArea } from '../context/LocationContext'
import {
  fetchLocalGovernmentAreasAtPoint,
  fetchNativeSpeciesForLgaPage,
  fetchTaxonConceptDetail,
  fetchTaxonHeroThumbnailUrl,
  searchVicFloraSpecies,
  vicfloraTaxonUrl,
  type VicFloraSearchDoc,
  type VicFloraTaxonDetail,
} from '../lib/vicflora'

/** Solr rows per request (VicFlora search pagination). */
const SUGGESTION_API_PAGE_SIZE = 10
/** Initial visible rows and how many more each “Show more” reveals. */
const SUGGESTION_VISIBLE_STEP = 10

function hasVicFloraCommonName(d: VicFloraSearchDoc): boolean {
  return Boolean(d.preferredVernacularName?.trim())
}

/** Alphabetical by common name only (`preferredVernacularName`). Callers should filter to common names first. */
function sortVicFloraDocsByCommonName(docs: VicFloraSearchDoc[]): VicFloraSearchDoc[] {
  return [...docs].sort((a, b) => {
    const ca = a.preferredVernacularName!.trim()
    const cb = b.preferredVernacularName!.trim()
    const cmp = ca.localeCompare(cb, undefined, { sensitivity: 'base' })
    if (cmp !== 0) return cmp
    return a.id.localeCompare(b.id)
  })
}

/**
 * Fetches successive API pages until the pool has at least `minPoolSize` species with a common name,
 * or Solr has no more rows. Deduplicates by taxon id.
 */
async function growSuggestionPool(
  lga: string,
  minPoolSize: number,
  existingPool: VicFloraSearchDoc[],
  startPage: number,
  signal: AbortSignal,
): Promise<{ pool: VicFloraSearchDoc[]; nextPage: number; hasMoreFromApi: boolean | null }> {
  const byId = new Map<string, VicFloraSearchDoc>()
  for (const d of existingPool) {
    if (hasVicFloraCommonName(d)) byId.set(d.id, d)
  }

  let page = startPage
  let lastTotal = 0
  let fetchedAny = false

  while (byId.size < minPoolSize) {
    const { docs, total } = await fetchNativeSpeciesForLgaPage(lga, page, SUGGESTION_API_PAGE_SIZE, signal)
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    fetchedAny = true
    lastTotal = total
    for (const d of docs) {
      if (hasVicFloraCommonName(d)) byId.set(d.id, d)
    }

    const noMoreSolr = docs.length === 0 || page * SUGGESTION_API_PAGE_SIZE >= total
    page += 1
    if (noMoreSolr) break
  }

  const pool = sortVicFloraDocsByCommonName([...byId.values()])
  const hasMoreFromApi = fetchedAny
    ? lastTotal > 0 && (page - 1) * SUGGESTION_API_PAGE_SIZE < lastTotal
    : null
  return { pool, nextPage: page, hasMoreFromApi }
}

function VicFloraResultCard({
  doc,
  imageUrl,
  onOpen,
}: {
  doc: VicFloraSearchDoc
  imageUrl?: string | null
  onOpen: (doc: VicFloraSearchDoc) => void
}) {
  const common = doc.preferredVernacularName?.trim()
  const sci = doc.scientificName
  const primaryTitle = common || sci
  const showScientificLine =
    Boolean(common && sci && common.toLowerCase() !== sci.toLowerCase())
  const statusBits = [doc.occurrenceStatus, doc.establishmentMeans].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      className="card card-interactive vicflora-card"
      onClick={() => onOpen(doc)}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      <div className="plant-card-image-wrap vicflora-card__image">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="vicflora-card__image-placeholder" aria-hidden />
        )}
      </div>
      <div className="card-body" style={{ flex: 1, textAlign: 'left' }}>
        <h3 className="plant-card-title">{primaryTitle}</h3>
        {showScientificLine && <p className="plant-card-sci">{sci}</p>}
        {statusBits && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
            {statusBits}
          </p>
        )}
        <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', margin: 'var(--space-sm) 0 0' }}>
          View details
        </p>
      </div>
    </button>
  )
}

function formatVicFloraEnumLabel(value: string | null | undefined): string | null {
  if (!value) return null
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function PlantDetailDialogContent({
  detail,
  vicFloraPageUrl,
}: {
  detail: VicFloraTaxonDetail
  vicFloraPageUrl: string
}) {
  const common = detail.preferredVernacularName
  const sci = detail.scientificName
  const primaryTitle = common || sci
  const metaBits = [
    detail.family && `Family: ${detail.family}`,
    formatVicFloraEnumLabel(detail.taxonRank),
    formatVicFloraEnumLabel(detail.occurrenceStatus),
    formatVicFloraEnumLabel(detail.establishmentMeans),
  ].filter(Boolean) as string[]

  return (
    <>
      {detail.previewImageUrl && (
        <div className="plant-detail-dialog__hero">
          <img src={detail.previewImageUrl} alt="" loading="lazy" />
        </div>
      )}
      <div className="plant-detail-dialog__intro">
        <p className="plant-detail-dialog__primary">{primaryTitle}</p>
        {common && sci && common.toLowerCase() !== sci.toLowerCase() && (
          <p className="plant-detail-dialog__sci">{sci}</p>
        )}
        {metaBits.length > 0 && (
          <ul className="plant-detail-dialog__meta">
            {metaBits.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      {detail.summaryText && (
        <p className="plant-detail-dialog__summary">{detail.summaryText}</p>
      )}
      {!detail.summaryText && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
          No short description in VicFlora for this taxon yet. Use the link below for the full page.
        </p>
      )}
      <p style={{ margin: 'var(--space-md) 0 0', fontSize: '0.88rem' }}>
        <a href={vicFloraPageUrl} target="_blank" rel="noreferrer">
          Open full species page in VicFlora →
        </a>
      </p>
    </>
  )
}

export function PlantSearchPage() {
  const { coords, areaLabel } = useLocationArea()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')

  const [localGovernmentAreaName, setLocalGovernmentAreaName] = useState<string | null>(null)

  const [suggestionPool, setSuggestionPool] = useState<VicFloraSearchDoc[]>([])
  const [suggestionVisibleCount, setSuggestionVisibleCount] = useState(SUGGESTION_VISIBLE_STEP)
  const [suggestionNextApiPage, setSuggestionNextApiPage] = useState(1)
  const [suggestionHasMoreFromApi, setSuggestionHasMoreFromApi] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)

  const [vicDocs, setVicDocs] = useState<VicFloraSearchDoc[]>([])
  /** Raw row count from the last VicFlora search (before common-name filter). */
  const [vicRawDocCount, setVicRawDocCount] = useState(0)
  const [vicLoading, setVicLoading] = useState(false)
  const [vicError, setVicError] = useState<string | null>(null)

  const plantDetailDialogRef = useRef<HTMLDialogElement>(null)
  const plantDetailTitleId = useId()
  const [plantDetailId, setPlantDetailId] = useState<string | null>(null)
  const [plantDetail, setPlantDetail] = useState<VicFloraTaxonDetail | null>(null)
  const [plantDetailLoading, setPlantDetailLoading] = useState(false)
  const [plantDetailError, setPlantDetailError] = useState<string | null>(null)

  const openPlantDetail = useCallback((doc: VicFloraSearchDoc) => {
    setPlantDetailId(doc.id)
    setPlantDetail(null)
    setPlantDetailError(null)
    plantDetailDialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (!plantDetailId) return
    setPlantDetailLoading(true)
    const ac = new AbortController()
    fetchTaxonConceptDetail(plantDetailId, ac.signal)
      .then((d) => {
        if (ac.signal.aborted) return
        setPlantDetail(d)
        setPlantDetailError(d ? null : 'Could not load details from VicFlora.')
      })
      .catch(() => {
        if (!ac.signal.aborted) setPlantDetailError('Could not load details from VicFlora.')
      })
      .finally(() => {
        if (!ac.signal.aborted) setPlantDetailLoading(false)
      })
    return () => ac.abort()
  }, [plantDetailId])

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 380)
    return () => window.clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (!coords) {
      setLocalGovernmentAreaName(null)
      return
    }
    const ac = new AbortController()
    ;(async () => {
      try {
        const lgaList = await fetchLocalGovernmentAreasAtPoint(coords.lat, coords.lng, ac.signal)
        if (ac.signal.aborted) return
        setLocalGovernmentAreaName(lgaList[0]?.name ?? null)
      } catch {
        if (!ac.signal.aborted) setLocalGovernmentAreaName(null)
      }
    })()
    return () => ac.abort()
  }, [coords])

  const loadSuggestionData = useCallback(
    async (opts: {
      minPoolSize: number
      existingPool: VicFloraSearchDoc[]
      startPage: number
      signal: AbortSignal
    }) => {
      if (!localGovernmentAreaName) return
      setSuggestionLoading(true)
      setSuggestionError(null)
      try {
        const { pool, nextPage, hasMoreFromApi } = await growSuggestionPool(
          localGovernmentAreaName,
          opts.minPoolSize,
          opts.existingPool,
          opts.startPage,
          opts.signal,
        )
        if (opts.signal.aborted) return
        setSuggestionPool(pool)
        setSuggestionNextApiPage(nextPage)
        if (hasMoreFromApi !== null) setSuggestionHasMoreFromApi(hasMoreFromApi)
      } catch (e) {
        if (!opts.signal.aborted) {
          const msg = e instanceof Error ? e.message : 'Could not load suggestions'
          if ((e as Error).name !== 'AbortError') setSuggestionError(msg)
          setSuggestionHasMoreFromApi(false)
          setSuggestionPool([])
        }
      } finally {
        if (!opts.signal.aborted) setSuggestionLoading(false)
      }
    },
    [localGovernmentAreaName],
  )

  useEffect(() => {
    if (!localGovernmentAreaName) {
      setSuggestionPool([])
      setSuggestionVisibleCount(SUGGESTION_VISIBLE_STEP)
      setSuggestionNextApiPage(1)
      setSuggestionHasMoreFromApi(false)
      setSuggestionError(null)
      return
    }
    const ac = new AbortController()
    setSuggestionVisibleCount(SUGGESTION_VISIBLE_STEP)
    setSuggestionNextApiPage(1)
    void loadSuggestionData({
      minPoolSize: SUGGESTION_VISIBLE_STEP,
      existingPool: [],
      startPage: 1,
      signal: ac.signal,
    })
    return () => ac.abort()
  }, [localGovernmentAreaName, loadSuggestionData])

  const suggestionDisplayed = useMemo(
    () => suggestionPool.slice(0, suggestionVisibleCount),
    [suggestionPool, suggestionVisibleCount],
  )

  const suggestionCanShowMore =
    localGovernmentAreaName &&
    (suggestionVisibleCount < suggestionPool.length || suggestionHasMoreFromApi)

  const handleSuggestionShowMore = useCallback(() => {
    if (!localGovernmentAreaName) return
    const nextVisible = suggestionVisibleCount + SUGGESTION_VISIBLE_STEP
    setSuggestionVisibleCount(nextVisible)
    if (nextVisible <= suggestionPool.length) {
      return
    }
    const ac = new AbortController()
    void loadSuggestionData({
      minPoolSize: nextVisible,
      existingPool: suggestionPool,
      startPage: suggestionNextApiPage,
      signal: ac.signal,
    })
  }, [
    localGovernmentAreaName,
    loadSuggestionData,
    suggestionVisibleCount,
    suggestionPool,
    suggestionNextApiPage,
  ])

  const [heroThumbByTaxonId, setHeroThumbByTaxonId] = useState<Record<string, string>>({})
  const heroThumbFetchedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const want = new Set([...vicDocs.map((d) => d.id), ...suggestionDisplayed.map((d) => d.id)])
    const toFetch = [...want].filter((id) => !heroThumbFetchedRef.current.has(id))
    if (toFetch.length === 0) return
    const ac = new AbortController()
    void (async () => {
      const results = await Promise.all(toFetch.map((id) => fetchTaxonHeroThumbnailUrl(id, ac.signal)))
      if (ac.signal.aborted) return
      toFetch.forEach((id) => heroThumbFetchedRef.current.add(id))
      setHeroThumbByTaxonId((prev) => {
        const next = { ...prev }
        toFetch.forEach((id, i) => {
          const u = results[i]
          if (u) next[id] = u
        })
        return next
      })
    })()
    return () => ac.abort()
  }, [vicDocs, suggestionDisplayed])

  useEffect(() => {
    if (debounced.length < 2) {
      setVicDocs([])
      setVicRawDocCount(0)
      setVicError(null)
      return
    }
    const ac = new AbortController()
    setVicLoading(true)
    setVicError(null)
    searchVicFloraSpecies(debounced, {
      rows: 28,
      signal: ac.signal,
    })
      .then(({ docs }) => {
        if (ac.signal.aborted) return
        setVicRawDocCount(docs.length)
        const withCommon = docs.filter(hasVicFloraCommonName)
        setVicDocs(sortVicFloraDocsByCommonName(withCommon))
      })
      .catch((e) => {
        if (!ac.signal.aborted) {
          setVicError(e instanceof Error ? e.message : 'Search failed')
          setVicDocs([])
          setVicRawDocCount(0)
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setVicLoading(false)
      })
    return () => ac.abort()
  }, [debounced])

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">PlantMe</p>
        <h1>Search plants</h1>
      </header>

      <div className="search-field" style={{ marginBottom: 'var(--space-lg)' }}>
        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
          <IconSearch />
        </span>
        <label htmlFor="plant-search" className="sr-only">
          Search plant name
        </label>
        <input
          id="plant-search"
          type="search"
          placeholder="Search native Victorian species (scientific or common name)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
      </div>

      <section style={{ marginBottom: 'var(--space-xl)' }} aria-labelledby="search-results-heading">
        <h2 id="search-results-heading" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>
          VicFlora search results
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          <strong>Native</strong> species statewide (Victoria) — not limited to your council area. Data from{' '}
          <a href="https://vicflora.rbg.vic.gov.au" target="_blank" rel="noreferrer">
            VicFlora
          </a>
          .
        </p>

        {debounced.length >= 2 && localGovernmentAreaName && (
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--color-text)',
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <strong>Your LGA (council):</strong> {localGovernmentAreaName}
            <span style={{ color: 'var(--color-text-muted)' }}>
              {' '}
              — from your location in the header; search is still statewide native species.
            </span>
          </p>
        )}
        {debounced.length >= 2 && !localGovernmentAreaName && !coords && (
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
            <strong>LGA:</strong> not shown — use <strong>Change</strong> in the header to set GPS or postcode so we can
            look up your council (VicFlora).
          </p>
        )}

        {vicLoading && debounced.length >= 2 && (
          <p style={{ color: 'var(--color-text-muted)' }}>Searching VicFlora…</p>
        )}
        {vicError && (
          <div className="card card-body" style={{ borderColor: 'var(--color-danger)', marginBottom: 'var(--space-md)' }}>
            <p style={{ margin: 0 }}>{vicError}</p>
          </div>
        )}

        {!vicLoading && debounced.length >= 2 && vicDocs.length > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
            {vicDocs.length.toLocaleString()} species
          </p>
        )}

        <div className="plant-grid">
          {vicDocs.map((doc) => (
            <VicFloraResultCard
              key={doc.id}
              doc={doc}
              imageUrl={heroThumbByTaxonId[doc.id]}
              onOpen={openPlantDetail}
            />
          ))}
        </div>

        {debounced.length >= 2 && !vicLoading && vicDocs.length === 0 && !vicError && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-lg)' }}>
            {vicRawDocCount === 0
              ? 'No species found. Try different words.'
              : 'No species with a common name in these results. Try different words.'}
          </p>
        )}

        {debounced.length < 2 && (
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
            Enter at least 2 characters in the search bar to query native species statewide in VicFlora.
          </p>
        )}
      </section>

      <section style={{ marginBottom: 'var(--space-xl)' }} aria-labelledby="suggested-heading">
        <h2 id="suggested-heading" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-sm)' }}>
          Suggested for your area
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
          <strong>Location:</strong> {areaLabel}
          {localGovernmentAreaName && (
            <>
              {' '}
              — <strong>Your council (LGA):</strong> {localGovernmentAreaName}. Suggestions are <strong>native</strong>{' '}
              species VicFlora records in this LGA.
            </>
          )}
          {!localGovernmentAreaName && (
            <>
              {' '}
              — set <strong>GPS</strong> or enter a <strong>postcode or suburb</strong> via <strong>Change</strong> in
              the header so we can resolve your Victorian council and load suggestions.
            </>
          )}
        </p>

        {suggestionError && (
          <div className="card card-body" style={{ borderColor: 'var(--color-danger)', marginBottom: 'var(--space-md)' }}>
            <p style={{ margin: 0 }}>{suggestionError}</p>
          </div>
        )}

        {suggestionLoading && suggestionPool.length === 0 && localGovernmentAreaName && (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading native species for your council…</p>
        )}

        {localGovernmentAreaName && (
          <>
            <div className="plant-grid">
              {suggestionDisplayed.map((doc) => (
                <VicFloraResultCard
                  key={doc.id}
                  doc={doc}
                  imageUrl={heroThumbByTaxonId[doc.id]}
                  onOpen={openPlantDetail}
                />
              ))}
            </div>
            {suggestionCanShowMore && (
              <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={suggestionLoading}
                  onClick={handleSuggestionShowMore}
                >
                  {suggestionLoading ? 'Loading…' : 'Show more'}
                </button>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
                  Showing {suggestionDisplayed.length.toLocaleString()} of {suggestionPool.length.toLocaleString()}{' '}
                  loaded in {localGovernmentAreaName}
                </p>
              </div>
            )}
            {!suggestionLoading && suggestionPool.length === 0 && !suggestionError && !suggestionCanShowMore && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No species with a common name in these results for this area.
              </p>
            )}
            {!suggestionLoading && suggestionPool.length === 0 && !suggestionError && suggestionCanShowMore && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
                No species with a common name on the loaded pages yet — try <strong>Show more</strong>.
              </p>
            )}
          </>
        )}
      </section>

      <dialog
        ref={plantDetailDialogRef}
        className="plant-detail-dialog"
        aria-labelledby={plantDetailTitleId}
        onClose={() => {
          setPlantDetailId(null)
          setPlantDetail(null)
          setPlantDetailError(null)
          setPlantDetailLoading(false)
        }}
      >
        <div className="plant-detail-dialog__inner">
          <header className="plant-detail-dialog__header">
            <h2 id={plantDetailTitleId} className="plant-detail-dialog__title">
              {plantDetail
                ? plantDetail.preferredVernacularName || plantDetail.scientificName
                : 'Plant details'}
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
            {plantDetailLoading && (
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Loading…</p>
            )}
            {plantDetailError && !plantDetailLoading && (
              <p style={{ color: 'var(--color-danger)', margin: 0 }}>{plantDetailError}</p>
            )}
            {plantDetailError && !plantDetailLoading && plantDetailId && !plantDetail && (
              <p style={{ margin: 'var(--space-sm) 0 0', fontSize: '0.88rem' }}>
                <a href={vicfloraTaxonUrl(plantDetailId)} target="_blank" rel="noreferrer">
                  Open this species in VicFlora →
                </a>
              </p>
            )}
            {plantDetail && !plantDetailLoading && (
              <PlantDetailDialogContent
                detail={plantDetail}
                vicFloraPageUrl={vicfloraTaxonUrl(plantDetail.id)}
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
