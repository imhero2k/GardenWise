/**
 * POC: enrich a scientific name with public, CORS-friendly APIs (no API keys).
 * - Wikipedia REST: summary + thumbnail
 * - GBIF Species API: backbone match + species page link
 * - iNaturalist: community photos + optional Wikipedia link
 *
 * Wikimedia User-Agent policy: https://meta.wikimedia.org/wiki/User-Agent_policy
 */

const WIKI_HEADERS = {
  'Api-User-Agent': 'GardenWise/1.0 (https://github.com/imhero2k/GardenWise)',
}

export type PlantEnrichmentImage = {
  url: string
  source: 'wikipedia' | 'inaturalist'
  attribution?: string
}

export type PlantEnrichment = {
  scientificNameQuery: string
  wikipedia?: {
    title: string
    extract: string
    pageUrl: string
    thumbnailUrl?: string
  }
  gbif?: {
    usageKey: number
    canonicalName: string
    rank?: string
    status?: string
    speciesPageUrl: string
  }
  inaturalist?: {
    taxonPageUrl: string
    commonName?: string
    wikipediaUrl?: string
  }
  images: PlantEnrichmentImage[]
}

function wikiTitleFromName(name: string): string {
  return name.trim().replace(/\s+/g, '_')
}

type WikipediaSummary = {
  title: string
  extract: string
  pageUrl: string
  thumbnailUrl?: string
}

/**
 * Direct Wikipedia REST summary lookup for the given title. Returns undefined when the
 * page does not exist, is a disambiguation/list page, or has no extract.
 */
async function fetchWikipediaSummaryByTitle(
  title: string,
  signal?: AbortSignal,
): Promise<WikipediaSummary | undefined> {
  const wikiTitle = wikiTitleFromName(title)
  if (!wikiTitle) return undefined
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
  const res = await fetch(url, { signal, headers: WIKI_HEADERS })
  if (!res.ok) return undefined
  const data = (await res.json()) as {
    title?: string
    extract?: string
    type?: string
    content_urls?: { desktop?: { page?: string } }
    thumbnail?: { source?: string }
  }
  if (data.type === 'disambiguation') return undefined
  const pageUrl = data.content_urls?.desktop?.page
  if (!data.extract || !pageUrl) return undefined
  return {
    title: data.title ?? wikiTitle.replace(/_/g, ' '),
    extract: data.extract,
    pageUrl,
    thumbnailUrl: data.thumbnail?.source,
  }
}

/**
 * Wikipedia opensearch fallback for cases where the exact title doesn't resolve. Returns the
 * best-matching article title we can then summarise.
 */
async function fetchWikipediaTitleByQuery(query: string, signal?: AbortSignal): Promise<string | undefined> {
  const u = new URL('https://en.wikipedia.org/w/api.php')
  u.searchParams.set('action', 'opensearch')
  u.searchParams.set('search', query.trim())
  u.searchParams.set('limit', '1')
  u.searchParams.set('namespace', '0')
  u.searchParams.set('format', 'json')
  u.searchParams.set('origin', '*')
  const res = await fetch(u.toString(), { signal, headers: WIKI_HEADERS })
  if (!res.ok) return undefined
  const data = (await res.json()) as [string, string[], string[], string[]] | unknown
  if (!Array.isArray(data) || !Array.isArray(data[1]) || data[1].length === 0) return undefined
  const title = data[1][0]
  return typeof title === 'string' && title.trim() ? title : undefined
}

/**
 * Try the title verbatim, then fall back to opensearch suggestions if the page doesn't exist.
 */
async function resolveWikipediaSummary(
  query: string,
  signal?: AbortSignal,
): Promise<WikipediaSummary | undefined> {
  const direct = await fetchWikipediaSummaryByTitle(query, signal).catch(() => undefined)
  if (direct) return direct
  const suggested = await fetchWikipediaTitleByQuery(query, signal).catch(() => undefined)
  if (!suggested) return undefined
  return fetchWikipediaSummaryByTitle(suggested, signal).catch(() => undefined)
}

async function fetchGbifMatch(scientificName: string, signal?: AbortSignal) {
  const u = new URL('https://api.gbif.org/v1/species/match')
  u.searchParams.set('name', scientificName.trim())
  const res = await fetch(u.toString(), { signal })
  if (!res.ok) return undefined
  const data = (await res.json()) as {
    usageKey?: number
    scientificName?: string
    canonicalName?: string
    rank?: string
    status?: string
  }
  if (data.usageKey == null) return undefined
  const canonical = data.canonicalName ?? data.scientificName ?? scientificName
  return {
    usageKey: data.usageKey,
    canonicalName: canonical,
    rank: data.rank,
    status: data.status,
    speciesPageUrl: `https://www.gbif.org/species/${data.usageKey}`,
  }
}

type INatTaxon = {
  id?: number
  name?: string
  preferred_common_name?: string
  wikipedia_url?: string
  default_photo?: { medium_url?: string; attribution?: string }
}

async function fetchINaturalist(scientificName: string, signal?: AbortSignal) {
  const u = new URL('https://api.inaturalist.org/v1/taxa')
  u.searchParams.set('q', scientificName.trim())
  u.searchParams.set('per_page', '8')
  const res = await fetch(u.toString(), { signal })
  if (!res.ok) return { images: [] as PlantEnrichmentImage[], meta: undefined as PlantEnrichment['inaturalist'] }
  const data = (await res.json()) as { results?: INatTaxon[] }
  const results = data.results ?? []
  const images: PlantEnrichmentImage[] = []
  const seen = new Set<string>()
  let best: INatTaxon | undefined

  for (const t of results) {
    if (!best && t.name && scientificName.trim().toLowerCase() === t.name.toLowerCase()) best = t
    const url = t.default_photo?.medium_url
    if (!url || seen.has(url)) continue
    seen.add(url)
    images.push({
      url,
      source: 'inaturalist',
      attribution: t.default_photo?.attribution,
    })
    if (images.length >= 4) break
  }

  const pick = best ?? results[0]
  const meta =
    pick?.id != null
      ? {
          taxonPageUrl: `https://www.inaturalist.org/taxa/${pick.id}`,
          commonName: pick.preferred_common_name,
          wikipediaUrl: pick.wikipedia_url,
        }
      : undefined

  return { images, meta }
}

/**
 * Enrich a plant by scientific name using Wikipedia, GBIF, and iNaturalist.
 */
export async function enrichPlantByScientificName(
  scientificName: string,
  signal?: AbortSignal,
): Promise<PlantEnrichment> {
  const q = scientificName.trim()
  const images: PlantEnrichmentImage[] = []

  const [wiki, gbif, inat] = await Promise.all([
    resolveWikipediaSummary(q, signal).catch(() => undefined),
    fetchGbifMatch(q, signal).catch(() => undefined),
    fetchINaturalist(q, signal).catch(() => ({ images: [], meta: undefined })),
  ])

  if (wiki?.thumbnailUrl) {
    images.push({ url: wiki.thumbnailUrl, source: 'wikipedia' })
  }
  for (const img of inat.images) {
    if (!images.some((i) => i.url === img.url)) images.push(img)
  }

  return {
    scientificNameQuery: q,
    wikipedia: wiki,
    gbif,
    inaturalist: inat.meta,
    images,
  }
}
