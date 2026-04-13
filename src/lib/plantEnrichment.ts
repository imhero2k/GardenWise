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

function wikiTitleFromScientificName(name: string): string {
  return name.trim().replace(/\s+/g, '_')
}

async function fetchWikipediaSummary(scientificName: string, signal?: AbortSignal) {
  const title = wikiTitleFromScientificName(scientificName)
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, { signal, headers: WIKI_HEADERS })
  if (!res.ok) return undefined
  const data = (await res.json()) as {
    title?: string
    extract?: string
    content_urls?: { desktop?: { page?: string } }
    thumbnail?: { source?: string }
  }
  const pageUrl = data.content_urls?.desktop?.page
  if (!data.extract || !pageUrl) return undefined
  return {
    title: data.title ?? title.replace(/_/g, ' '),
    extract: data.extract,
    pageUrl,
    thumbnailUrl: data.thumbnail?.source,
  }
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

export async function enrichPlantByScientificName(
  scientificName: string,
  signal?: AbortSignal,
): Promise<PlantEnrichment> {
  const q = scientificName.trim()
  const images: PlantEnrichmentImage[] = []

  const [wiki, gbif, inat] = await Promise.all([
    fetchWikipediaSummary(q, signal).catch(() => undefined),
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
