/**
 * Atlas of Living Australia — species search (BIE index via api.ala.org.au).
 * @see https://docs.ala.org.au/
 *
 * Public JSON; `access-control-allow-origin: *` (browser-friendly).
 */

const ALA_SPECIES_SEARCH = 'https://api.ala.org.au/species/search'

export interface AlaSpeciesHit {
  id?: string
  guid?: string
  scientificName?: string
  scientificNameAuthorship?: string
  nameComplete?: string
  commonName?: string
  rank?: string
  taxonomicStatus?: string
  occurrenceCount?: number
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  thumbnailUrl?: string
  infoSourceName?: string
}

interface AlaSpeciesSearchResponse {
  searchResults?: {
    totalRecords?: number
    results?: AlaSpeciesHit[]
  }
}

/**
 * Returns the first taxon match for a scientific or common name query, or null if none.
 */
export async function fetchAlaSpeciesSearch(
  query: string,
  signal?: AbortSignal,
): Promise<AlaSpeciesHit | null> {
  const q = query.trim()
  if (!q) return null
  const url = `${ALA_SPECIES_SEARCH}?${new URLSearchParams({ q, pageSize: '1' })}`
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`ALA species search failed (${r.status})`)
  const j = (await r.json()) as AlaSpeciesSearchResponse
  const hit = j.searchResults?.results?.[0]
  return hit ?? null
}

/** BIE species page (occurrences, maps, etc.). */
export function alaBieSpeciesPageUrl(scientificName: string): string {
  return `https://bie.ala.org.au/species/${encodeURIComponent(scientificName)}`
}

/** Weeds Australia profile collection on ALA Profiles. */
export function alaWeedsAustraliaProfileUrl(scientificName: string): string {
  return `https://profiles.ala.org.au/opus/weeds-australia/profile/${encodeURIComponent(scientificName)}`
}
