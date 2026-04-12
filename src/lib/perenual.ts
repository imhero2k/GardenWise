/**
 * Perenual REST API — optional garden/care data (global database, not Vic-specific).
 * @see https://perenual.com/docs/api
 *
 * Set `VITE_PERENUAL_API_KEY` in `.env.local` (from https://perenual.com/user/developer).
 */

const PERENUAL_ORIGIN = 'https://perenual.com'

export interface PerenualCareSummary {
  /** Perenual species id (for linking). */
  id: number
  matchedScientificName: string
  commonName: string | null
  cycle: string | null
  watering: string | null
  sunlight: string[]
  careLevel: string | null
  maintenance: string | null
  growthRate: string | null
  description: string | null
  imageUrl: string | null
  poisonousToHumans: boolean | null
  poisonousToPets: boolean | null
}

interface SpeciesListResponse {
  data?: Array<{
    id: number
    common_name: string | null
    scientific_name: string[] | null
    default_image?: { medium_url?: string | null; regular_url?: string | null } | null
  }>
}

interface SpeciesDetailResponse {
  id?: number
  common_name?: string | null
  scientific_name?: string[] | null
  cycle?: string | null
  watering?: string | null
  sunlight?: string[] | null
  care_level?: string | null
  maintenance?: string | null
  growth_rate?: string | null
  description?: string | null
  poisonous_to_humans?: boolean | null
  poisonous_to_pets?: boolean | null
  default_image?: { medium_url?: string | null; regular_url?: string | null } | null
}

function perenualKey(): string | undefined {
  return import.meta.env.VITE_PERENUAL_API_KEY?.trim() || undefined
}

function binomialKey(scientificName: string): string {
  const parts = scientificName.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return scientificName.trim().toLowerCase()
  return `${parts[0]} ${parts[1]}`.toLowerCase()
}

function scientificNamesMatchListItem(binomial: string, scientificNames: string[] | null | undefined): boolean {
  const b = binomialKey(binomial)
  if (!scientificNames?.length) return false
  for (const raw of scientificNames) {
    const n = raw.trim()
    if (!n) continue
    const two = n.split(/\s+/).filter(Boolean)
    if (two.length >= 2) {
      const key = `${two[0]} ${two[1]}`.toLowerCase()
      if (key === b) return true
    }
    if (n.toLowerCase() === b) return true
  }
  return false
}

function pickListMatch(
  binomial: string,
  items: SpeciesListResponse['data'],
): NonNullable<SpeciesListResponse['data']>[number] | null {
  if (!items?.length) return null
  for (const item of items) {
    if (scientificNamesMatchListItem(binomial, item.scientific_name)) return item
  }
  return null
}

function truncateDescription(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

/**
 * Fetches Perenual care/detail for a VicFlora-style scientific name.
 * Returns null if no API key, no match, or request error (fail-soft for UX).
 */
export async function fetchPerenualCareByScientificName(
  scientificName: string,
  signal?: AbortSignal,
): Promise<PerenualCareSummary | null> {
  const key = perenualKey()
  if (!key || !scientificName.trim()) return null

  const q = encodeURIComponent(scientificName.trim())
  const listUrl = `${PERENUAL_ORIGIN}/api/v2/species-list?key=${encodeURIComponent(key)}&q=${q}&page=1`

  let listRes: Response
  try {
    listRes = await fetch(listUrl, { signal })
  } catch {
    return null
  }
  if (!listRes.ok) return null

  let listJson: SpeciesListResponse
  try {
    listJson = (await listRes.json()) as SpeciesListResponse
  } catch {
    return null
  }

  const match = pickListMatch(scientificName, listJson.data)
  if (!match) return null

  const detailUrl = `${PERENUAL_ORIGIN}/api/v2/species/details/${match.id}?key=${encodeURIComponent(key)}`
  let detailRes: Response
  try {
    detailRes = await fetch(detailUrl, { signal })
  } catch {
    return null
  }
  if (!detailRes.ok) return null

  let d: SpeciesDetailResponse
  try {
    d = (await detailRes.json()) as SpeciesDetailResponse
  } catch {
    return null
  }

  const sci = d.scientific_name?.[0]?.trim() ?? match.scientific_name?.[0]?.trim() ?? scientificName.trim()
  const img = d.default_image?.medium_url ?? d.default_image?.regular_url ?? null

  return {
    id: d.id ?? match.id,
    matchedScientificName: sci,
    commonName: d.common_name ?? match.common_name ?? null,
    cycle: d.cycle ?? null,
    watering: d.watering ?? null,
    sunlight: Array.isArray(d.sunlight) ? d.sunlight : [],
    careLevel: d.care_level ?? null,
    maintenance: d.maintenance ?? null,
    growthRate: d.growth_rate ?? null,
    description: d.description ? truncateDescription(d.description, 560) : null,
    imageUrl: typeof img === 'string' ? img : null,
    poisonousToHumans: typeof d.poisonous_to_humans === 'boolean' ? d.poisonous_to_humans : null,
    poisonousToPets: typeof d.poisonous_to_pets === 'boolean' ? d.poisonous_to_pets : null,
  }
}

/** Public Perenual website page for a species (for “open in Perenual” links). */
export function perenualSpeciesWebUrl(speciesId: number): string {
  return `https://perenual.com/plant-species-database-search-finder/species/${speciesId}`
}
