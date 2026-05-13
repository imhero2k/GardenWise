import type { RegionMatchKind } from './recommendationsApi'

export type RegionWeed = {
  id: string
  scientificName: string
  commonName: string | null
  riskRating: string | null
  riskScore: number | null
  weedStatusVic: string | null
  isWons: boolean
}

export type WeedsResponse = {
  regionName: string | null
  regionMatch: RegionMatchKind | null
  weeds: RegionWeed[]
  pageSize: number
  offset: number
  hasMore: boolean
  q?: string | null
}

export type TopWeedsResponse = {
  weeds: RegionWeed[]
  pageSize: number
  offset: number
  hasMore: boolean
  q?: string | null
}

export type WeedLookupMatch = {
  id: string
  scientificName: string
  commonName: string | null
  lfCode: string | null
  riskRating: string | null
  riskScore: number | null
  weedStatusVic: string | null
  isWons: boolean
  matchKind: 'exact' | 'scientific_prefix'
  inBioregion: boolean | null
}

export type WeedLookupResponse = {
  match: WeedLookupMatch | null
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

export async function fetchRegionWeeds(
  lat: number,
  lng: number,
  signal?: AbortSignal,
  options?: { pageSize?: number; offset?: number; q?: string },
): Promise<WeedsResponse> {
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
  const path = `/api/weeds?${qs.toString()}`
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
  const j = (await r.json()) as Partial<WeedsResponse>
  return {
    regionName: j.regionName ?? null,
    regionMatch: j.regionMatch ?? null,
    weeds: j.weeds ?? [],
    pageSize: j.pageSize ?? pageSize,
    offset: j.offset ?? offset,
    hasMore: j.hasMore ?? false,
    q: j.q ?? null,
  }
}

export async function fetchTopWeeds(
  signal?: AbortSignal,
  options?: { pageSize?: number; offset?: number; q?: string },
): Promise<TopWeedsResponse> {
  const pageSize = options?.pageSize ?? 12
  const offset = options?.offset ?? 0
  const q = (options?.q ?? '').trim()
  const base = apiBase()
  const qs = new URLSearchParams({
    pageSize: String(pageSize),
    offset: String(offset),
  })
  if (q) qs.set('q', q)
  const path = `/api/weeds/top?${qs.toString()}`
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
  const j = (await r.json()) as Partial<TopWeedsResponse>
  return {
    weeds: j.weeds ?? [],
    pageSize: j.pageSize ?? pageSize,
    offset: j.offset ?? offset,
    hasMore: j.hasMore ?? false,
    q: j.q ?? null,
  }
}

export async function fetchWeedLookup(
  scientificName: string,
  options?: { lat?: number; lng?: number; signal?: AbortSignal },
): Promise<WeedLookupResponse> {
  const name = String(scientificName ?? '').trim()
  if (!name) return { match: null }
  const base = apiBase()
  const qs = new URLSearchParams({ name })
  const lat = options?.lat
  const lng = options?.lng
  if (typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)) {
    qs.set('lat', String(lat))
    qs.set('lng', String(lng))
  }
  const path = `/api/weeds/lookup?${qs.toString()}`
  const url = base ? `${base}${path}` : path
  const r = await fetch(url, { signal: options?.signal })
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
  const j = (await r.json()) as Partial<WeedLookupResponse>
  return { match: j.match ?? null }
}

