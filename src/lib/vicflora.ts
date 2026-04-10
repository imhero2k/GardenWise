/**
 * VicFlora GraphQL — Victorian flora (Royal Botanic Gardens Victoria).
 * @see https://vicflora.rbg.vic.gov.au/api
 */

const VICFLORA_GRAPHQL = 'https://vicflora.rbg.vic.gov.au/graphql'

export interface VicFloraSearchDoc {
  id: string
  scientificName: string
  taxonRank?: string | null
  preferredVernacularName?: string | null
  family?: string | null
  occurrenceStatus?: string | null
  establishmentMeans?: string | null
}

/** Search doc plus Victorian council areas where VicFlora records the species (from `taxonConceptLocalGovernmentAreas`). */
export type VicFloraSearchDocWithCouncils = VicFloraSearchDoc & {
  councilAreas?: string[]
}

export function vicfloraTaxonUrl(taxonId: string): string {
  return `https://vicflora.rbg.vic.gov.au/flora/taxon/${encodeURIComponent(taxonId)}`
}

const TAXON_HERO_THUMB = `query TaxonHeroThumb($id: ID!) {
  taxonConcept(id: $id) {
    heroImage {
      thumbnailUrl
    }
  }
}`

/** Representative photo thumbnail for a taxon (VicFlora hero image), or null if none. */
export async function fetchTaxonHeroThumbnailUrl(
  taxonConceptId: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const data = await graphql<{
      taxonConcept: { heroImage: { thumbnailUrl: string | null } | null } | null
    }>(TAXON_HERO_THUMB, { id: taxonConceptId }, signal)
    const url = data.taxonConcept?.heroImage?.thumbnailUrl?.trim()
    return url || null
  } catch {
    return null
  }
}

const TAXON_DETAIL = `query TaxonDetail($id: ID!) {
  taxonConcept(id: $id) {
    id
    taxonRank
    occurrenceStatus
    establishmentMeans
    taxonName { fullName }
    preferredVernacularName { name }
    heroImage { previewUrl thumbnailUrl }
    currentProfile { profile }
    higherClassification {
      taxonRank
      taxonName { fullName }
    }
  }
}`

/** Rich taxon data for UI (modal / detail panel). */
export interface VicFloraTaxonDetail {
  id: string
  scientificName: string
  preferredVernacularName: string | null
  family: string | null
  taxonRank: string | null
  occurrenceStatus: string | null
  establishmentMeans: string | null
  /** Plain-text summary: first description paragraph from VicFlora profile (not full treatment). */
  summaryText: string | null
  previewImageUrl: string | null
}

const SUMMARY_MAX_CHARS = 800

function stripSimpleHtmlTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** First paragraph of `.description` from VicFlora profile HTML, as plain text (short summary). */
function summaryTextFromVicFloraProfile(profileHtml: string | null): string | null {
  if (!profileHtml?.trim()) return null

  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(
        `<div class="vf-parse-root">${profileHtml}</div>`,
        'text/html',
      )
      const root = doc.querySelector('.vf-parse-root')
      const desc = root?.querySelector('.description')
      const firstP = desc?.querySelector('p')
      let text = (firstP?.textContent ?? desc?.textContent)?.trim() ?? ''
      if (!text) text = root?.textContent?.trim() ?? ''
      if (!text) return null
      if (text.length > SUMMARY_MAX_CHARS) text = `${text.slice(0, SUMMARY_MAX_CHARS - 1)}…`
      return text
    } catch {
      /* regex fallback */
    }
  }

  const block = profileHtml.match(/class="description"[^>]*>([\s\S]*?)<\/div>/i)
  if (block) {
    const inner = block[1]
    const pMatch = inner.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    const raw = pMatch ? pMatch[1] : inner
    const text = stripSimpleHtmlTags(raw)
    if (text) {
      return text.length > SUMMARY_MAX_CHARS ? `${text.slice(0, SUMMARY_MAX_CHARS - 1)}…` : text
    }
  }
  return null
}

function familyFromHigherClassification(
  rows:
    | { taxonRank: string | null; taxonName: { fullName: string | null } | null }[]
    | null
    | undefined,
): string | null {
  const fam = rows?.find((r) => r.taxonRank === 'FAMILY')
  return fam?.taxonName?.fullName?.trim() ?? null
}

export async function fetchTaxonConceptDetail(
  taxonConceptId: string,
  signal?: AbortSignal,
): Promise<VicFloraTaxonDetail | null> {
  try {
    const data = await graphql<{
      taxonConcept: {
        id: string
        taxonRank: string | null
        occurrenceStatus: string | null
        establishmentMeans: string | null
        taxonName: { fullName: string | null } | null
        preferredVernacularName: { name: string | null } | null
        heroImage: { previewUrl: string | null; thumbnailUrl: string | null } | null
        currentProfile: { profile: string } | null
        higherClassification: { taxonRank: string | null; taxonName: { fullName: string | null } | null }[] | null
      } | null
    }>(TAXON_DETAIL, { id: taxonConceptId }, signal)
    const t = data.taxonConcept
    if (!t) return null
    const preview =
      t.heroImage?.previewUrl?.trim() || t.heroImage?.thumbnailUrl?.trim() || null
    const rawProfile = t.currentProfile?.profile?.trim() ?? null
    return {
      id: t.id,
      scientificName: t.taxonName?.fullName?.trim() ?? '',
      preferredVernacularName: t.preferredVernacularName?.name?.trim() ?? null,
      family: familyFromHigherClassification(t.higherClassification),
      taxonRank: t.taxonRank ?? null,
      occurrenceStatus: t.occurrenceStatus ?? null,
      establishmentMeans: t.establishmentMeans ?? null,
      summaryText: summaryTextFromVicFloraProfile(rawProfile),
      previewImageUrl: preview,
    }
  } catch {
    return null
  }
}

/** Escape a bioregion label for Solr fq (spaces → `\ `). */
export function bioregionToFq(bioregionName: string): string {
  const t = bioregionName.trim()
  if (!t) return ''
  return `bioregion:${t.replace(/ /g, '\\ ')}`
}

/** Escape an LGA / council name for Solr fq (same pattern as bioregion; quoted phrases can 500 on VicFlora). */
export function localGovernmentAreaToFq(lgaName: string): string {
  const t = lgaName.trim()
  if (!t) return ''
  return `local_government_area:${t.replace(/ /g, '\\ ')}`
}

/** IBRA7 subregion phrase filter (matches VicFlora download / Solr `ibra_7_subregion` when exposed in search). */
export function ibra7SubregionToFq(subregionName: string): string {
  const t = subregionName.trim()
  if (!t) return ''
  const esc = t.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `ibra_7_subregion:"${esc}"`
}

/** Strip characters that could break Solr query strings inside our template. */
export function sanitizeVicFloraTerm(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s\-']/gu, '')
    .trim()
    .slice(0, 80)
}

/**
 * Species-level search on scientific or preferred vernacular name.
 * Pair with `establishment_means:native` in Solr `fq` (see `searchVicFloraSpecies`).
 */
export function buildSpeciesSearchQuery(term: string): string {
  const t = sanitizeVicFloraTerm(term).toLowerCase()
  if (!t) return ''
  const parts = t.split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  const esc = (s: string) => s.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1')
  const sci = parts.map((p) => `scientific_name:*${esc(p)}*`).join(' AND ')
  const ver = parts.map((p) => `vernacular_name:*${esc(p)}*`).join(' AND ')
  return `taxon_rank:species AND ((${sci}) OR (${ver}))`
}

interface GraphqlResponse<T> {
  data?: T
  errors?: { message: string }[]
}

async function graphql<T>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const r = await fetch(VICFLORA_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(variables ? { query, variables } : { query }),
    signal,
  })
  const j = (await r.json()) as GraphqlResponse<T>
  if (!r.ok) {
    throw new Error(`VicFlora request failed (${r.status})`)
  }
  if (j.errors?.length) {
    throw new Error(j.errors.map((e) => e.message).join('; ') || 'VicFlora error')
  }
  if (!j.data) throw new Error('VicFlora returned no data')
  return j.data
}

export interface BioregionAtPoint {
  name: string
  slug: string
}

/** Intersects Victorian bioregions with a WGS84 point. Empty if outside VIC coverage. */
export async function fetchBioregionsAtPoint(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<BioregionAtPoint[]> {
  const query = `query BioAtPoint($lat: Float!, $lng: Float!) {
    bioregionsByPoint(latitude: $lat, longitude: $lng) {
      properties { name slug }
    }
  }`
  const data = await graphql<{
    bioregionsByPoint: { properties: { name: string; slug: string } }[]
  }>(query, { lat: latitude, lng: longitude }, signal)
  const list = data.bioregionsByPoint ?? []
  return list
    .map((x) => x.properties)
    .filter((p): p is BioregionAtPoint => !!(p?.name && p?.slug))
}

export interface LocalGovernmentAreaAtPoint {
  name: string
  slug: string
}

/** Victorian council / LGA intersecting a WGS84 point (VicFlora boundaries). */
export async function fetchLocalGovernmentAreasAtPoint(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<LocalGovernmentAreaAtPoint[]> {
  const query = `query LgaAtPoint($lat: Float!, $lng: Float!) {
    localGovernmentAreasByPoint(latitude: $lat, longitude: $lng) {
      properties { name slug }
    }
  }`
  const data = await graphql<{
    localGovernmentAreasByPoint: { properties: { name: string; slug: string } }[]
  }>(query, { lat: latitude, lng: longitude }, signal)
  const list = data.localGovernmentAreasByPoint ?? []
  return list
    .map((x) => x.properties)
    .filter((p): p is LocalGovernmentAreaAtPoint => !!(p?.name && p?.slug))
}

export interface VicFloraSearchResult {
  docs: VicFloraSearchDoc[]
  total: number
}

const LGA_FOR_TAXON = `query LgaForTaxon($id: ID!) {
  taxonConceptLocalGovernmentAreas(taxonConceptId: $id) {
    localGovernmentAreaName
  }
}`

/** Sorted unique council names where this taxon has Victorian occurrence records (VicFlora). */
export async function fetchTaxonCouncilAreaNames(
  taxonConceptId: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    const data = await graphql<{
      taxonConceptLocalGovernmentAreas: { localGovernmentAreaName: string | null }[]
    }>(LGA_FOR_TAXON, { id: taxonConceptId }, signal)
    const names = (data.taxonConceptLocalGovernmentAreas ?? [])
      .map((x) => x.localGovernmentAreaName?.trim())
      .filter((n): n is string => !!n)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

/** One GraphQL round-trip per doc; use after search / regional page results. */
export async function enrichDocsWithCouncilAreas(
  docs: VicFloraSearchDoc[],
  signal?: AbortSignal,
): Promise<VicFloraSearchDocWithCouncils[]> {
  return Promise.all(
    docs.map(async (doc) => {
      const councilAreas = await fetchTaxonCouncilAreaNames(doc.id, signal)
      return { ...doc, councilAreas }
    }),
  )
}

const SEARCH_QUERY = `query VicSearch($input: SearchInput!) {
  search(input: $input) {
    meta { pagination { total } }
    docs {
      id
      scientificName
      taxonRank
      preferredVernacularName
      family
      occurrenceStatus
      establishmentMeans
    }
  }
}`

/** Solr fq: species established as native in Victoria (excludes introduced taxa). */
const ESTABLISHMENT_NATIVE_FQ = 'establishment_means:native'

export async function searchVicFloraSpecies(
  term: string,
  options: { rows?: number; signal?: AbortSignal },
): Promise<VicFloraSearchResult> {
  const q = buildSpeciesSearchQuery(term)
  if (!q) return { docs: [], total: 0 }

  const rows = Math.min(Math.max(options.rows ?? 28, 1), 50)
  const input: { q: string; fq: string[]; rows: number; page?: number } = {
    q,
    fq: [ESTABLISHMENT_NATIVE_FQ],
    rows,
    page: 1,
  }

  const data = await graphql<{
    search: {
      meta: { pagination: { total: number } | null } | null
      docs: VicFloraSearchDoc[] | null
    }
  }>(SEARCH_QUERY, { input }, options.signal)

  const docs = data.search?.docs ?? []
  const total = data.search?.meta?.pagination?.total ?? docs.length
  return { docs, total }
}

async function fetchRegionalSpeciesPageOnce(
  geographicFq: string,
  page: number,
  rows: number,
  signal?: AbortSignal,
): Promise<VicFloraSearchResult> {
  const fq0 = geographicFq.trim()
  if (!fq0) return { docs: [], total: 0 }

  const fq: string[] = [fq0, ESTABLISHMENT_NATIVE_FQ]

  const r = Math.min(Math.max(rows, 1), 50)
  const p = Math.max(1, Math.floor(page))
  const input = {
    q: 'taxon_rank:species',
    fq,
    rows: r,
    page: p,
  }

  const data = await graphql<{
    search: {
      meta: { pagination: { total: number } | null } | null
      docs: VicFloraSearchDoc[] | null
    }
  }>(SEARCH_QUERY, { input }, signal)

  const docs = data.search?.docs ?? []
  const total = data.search?.meta?.pagination?.total ?? docs.length
  return { docs, total }
}

/**
 * Native species in a geographic Solr slice (IBRA7 subregion and/or Victorian bioregion).
 * Tries `geographicFq` first. VicFlora’s public GraphQL search index often omits `ibra_7_subregion`;
 * when Solr reports that field as undefined, retries with `fallbackFq` (typically bioregion).
 */
export async function fetchRegionalSpeciesPage(
  geographicFq: string,
  page: number,
  rows: number,
  signal?: AbortSignal,
  options?: { fallbackFq?: string },
): Promise<VicFloraSearchResult> {
  const fb = options?.fallbackFq?.trim()
  const primary = geographicFq.trim()
  if (!primary) return { docs: [], total: 0 }

  try {
    return await fetchRegionalSpeciesPageOnce(primary, page, rows, signal)
  } catch (e) {
    if (fb && primary.includes('ibra_7_subregion')) {
      return fetchRegionalSpeciesPageOnce(fb, page, rows, signal)
    }
    throw e
  }
}

/** Native species recorded in the given Victorian LGA (Solr `local_government_area` + establishment native). */
export async function fetchNativeSpeciesForLgaPage(
  lgaName: string,
  page: number,
  rows: number,
  signal?: AbortSignal,
): Promise<VicFloraSearchResult> {
  const fq = localGovernmentAreaToFq(lgaName)
  if (!fq) return { docs: [], total: 0 }
  return fetchRegionalSpeciesPageOnce(fq, page, rows, signal)
}
