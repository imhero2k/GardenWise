export type RecommendedPlant = {
  id: string
  scientificName: string
  commonName: string | null
  family: string | null
  description: string | null
  imageUrl: string | null
  /** Client-only: Wikipedia / GBIF link when enriched in the UI */
  externalLinkUrl?: string | null
}

export type RegionMatchKind = 'contained' | 'nearest'

export type RecommendationsResponse = {
  regionName: string | null
  /** `nearest` when the point was not inside any bioregion polygon (distance fallback). */
  regionMatch: RegionMatchKind | null
  plants: RecommendedPlant[]
  pageSize: number
  offset: number
  hasMore: boolean
  q?: string | null
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

/**
 * Native / regional recommendations from the app’s PostgreSQL API (see `server/`).
 * In dev, Vite proxies `/api` to the local API server when `VITE_API_BASE_URL` is unset.
 */
export async function fetchRecommendations(
  lat: number,
  lng: number,
  signal?: AbortSignal,
  options?: { pageSize?: number; offset?: number; q?: string },
): Promise<RecommendationsResponse> {
  const pageSize = options?.pageSize ?? 12
  const offset = options?.offset ?? 0
  const q = (options?.q ?? '').trim()
  const base = apiBase()
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    pageSize: String(pageSize),
    offset: String(offset),
  })
  if (q) qs.set('q', q)
  const path = `/api/recommendations?${qs.toString()}`
  const url = base ? `${base}${path}` : path
  const r = await fetch(url, { signal })
  if (!r.ok) {
    let msg = `Request failed (${r.status})`
    try {
      const j = (await r.json()) as { error?: string }
      if (j.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const j = (await r.json()) as Partial<RecommendationsResponse>
  return {
    regionName: j.regionName ?? null,
    regionMatch: j.regionMatch ?? null,
    plants: j.plants ?? [],
    pageSize: j.pageSize ?? 12,
    offset: j.offset ?? 0,
    hasMore: j.hasMore ?? false,
    q: j.q ?? null,
  }
}
