/**
 * Shared SQL helpers for RootVio endpoints.
 *
 * Schema is fixed (PostgreSQL 17 + PostGIS 3.5 on RDS):
 *   plant(id, scientific_name, common_name, lf_code, nursery_available)
 *   bioregion(id, bioregion_name, boundary geometry MULTIPOLYGON SRID 4326)  -- GiST indexed
 *   bioregion_plant(bioregion_id, plant_id, recommendation_weight)
 *   weed_info(plant_id PK, risk_rating, risk_score, weed_status_vic,
 *             impact_natural_systems, impact_score, invasiveness_score, is_wons)
 *
 * `vic_bioregions` exists but is unused at runtime (every bioregion row has a populated
 * boundary), so we don't fall back to it any more.
 */

/**
 * Sanitise a free-text search term. Conservative: keeps letters/numbers/spaces and a few
 * punctuation marks, caps length to 60. Empty string means "no filter".
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function safeSearchTerm(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  return t.replace(/[^\p{L}\p{N}\s\-\.'"]/gu, '').slice(0, 60).trim()
}

/**
 * Returns a CTE pair (`pt`, `hit`) that resolves the user's lat/lng to exactly one
 * bioregion: prefer the polygon that contains the point, otherwise the nearest one.
 * Caller binds `$1` (lng) and `$2` (lat) as float8.
 *
 * Output columns of `hit`: `bioregion_id INT`, `region_inside BOOL`.
 */
export const BIOREGION_HIT_CTE = /* sql */ `
  pt AS (
    SELECT ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326) AS g
  ),
  hit AS (
    SELECT s.bioregion_id, s.inside AS region_inside
    FROM (
      SELECT b.id AS bioregion_id,
        ST_Contains(b.boundary, pt.g) AS inside,
        ST_Distance(b.boundary::geography, pt.g::geography) AS dist_m
      FROM bioregion b, pt
    ) s
    ORDER BY s.inside DESC, s.dist_m ASC, s.bioregion_id ASC
    LIMIT 1
  )
`

/** Common plant column projection used by recommendations & region-weeds queries. */
export const PLANT_SELECT = /* sql */ `
  p.id,
  p.scientific_name,
  p.common_name
`

/**
 * Wildlife-category vocabulary mapped to (trait_name, trait_value) pairs in `plant_trait`.
 * Categories are user-facing (Birds, Insects, Mammals); each maps to one or more (name, value)
 * pairs that count as "this plant attracts this wildlife group" — matched in the dispersers
 * and pollination_syndrome traits.
 *
 * @type {Record<string, { label: string; pairs: Array<[string, string]> }>}
 */
export const WILDLIFE_CATEGORIES = {
  birds: {
    label: 'Birds',
    pairs: [
      ['dispersers', 'birds'],
      ['dispersers', 'flying_vertebrates'],
      ['pollination_syndrome', 'bird'],
    ],
  },
  insects: {
    label: 'Insects',
    pairs: [
      ['dispersers', 'invertebrates'],
      ['dispersers', 'ants'],
      ['pollination_syndrome', 'insect'],
      ['pollination_syndrome', 'bee'],
    ],
  },
  mammals: {
    label: 'Mammals',
    pairs: [
      ['dispersers', 'mammals'],
      ['pollination_syndrome', 'mammal'],
    ],
  },
}

/**
 * Parse a `?wildlife=birds,insects` style param into known category keys (lowercased,
 * deduped, unknowns dropped). Empty / whitespace / unknown-only input → empty array.
 *
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseWildlifeCategories(raw) {
  if (raw == null) return []
  const list = Array.isArray(raw) ? raw : String(raw).split(',')
  const seen = new Set()
  const out = []
  for (const item of list) {
    const key = String(item ?? '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    if (Object.prototype.hasOwnProperty.call(WILDLIFE_CATEGORIES, key)) {
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

/**
 * Flatten selected wildlife category keys into two parallel arrays of `(trait_name, trait_value)`
 * suitable for binding to `unnest($n::text[], $m::text[])`. A plant matches if ANY pair matches
 * (i.e. selecting more categories broadens the result).
 *
 * @param {string[]} categories
 * @returns {{ traitNames: string[]; traitValues: string[] }}
 */
export function wildlifeTraitArrays(categories) {
  const traitNames = []
  const traitValues = []
  for (const key of categories) {
    const cat = WILDLIFE_CATEGORIES[key]
    if (!cat) continue
    for (const [name, value] of cat.pairs) {
      traitNames.push(name)
      traitValues.push(value)
    }
  }
  return { traitNames, traitValues }
}

/**
 * @param {Record<string, unknown> | undefined} firstRow
 */
export function regionMetaFrom(firstRow) {
  const regionName =
    firstRow?.region_name != null ? String(firstRow.region_name).trim() || null : null
  const ri = firstRow?.region_inside
  /** @type {'contained' | 'nearest' | null} */
  const regionMatch = ri === true ? 'contained' : ri === false ? 'nearest' : null
  return { regionName, regionMatch }
}
