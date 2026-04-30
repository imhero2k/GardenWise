/**
 * Coordinate-based plant recommendations from PostgreSQL / PostGIS.
 *
 * Strategy:
 * 1. Find one bioregion: containing polygon, else nearest polygon (geography distance).
 * 2. Join bioregion → bioregion_plant → plant.
 * 3. Exclude any plant present in `weed_info`.
 * 4. Optional `wildlife` filter (birds/insects/mammals): EXISTS-subquery into `plant_trait`.
 * 5. Order by `bioregion_plant.recommendation_weight` DESC (currently NULL for all rows;
 *    column is reserved for future ranking work), then alphabetically.
 *
 * `family`, `description`, `image_url` are not stored in the DB; they are returned as null
 * and the client enriches them via VicFlora (see `src/lib/vicflora.ts`).
 */

import {
  BIOREGION_HIT_CTE,
  PLANT_SELECT,
  regionMetaFrom,
  safeSearchTerm,
  wildlifeTraitArrays,
} from './db.mjs'

const RECOMMENDATIONS_SQL = /* sql */ `
  WITH ${BIOREGION_HIT_CTE},
  dedup AS (
    SELECT DISTINCT ON (p.id)
      ${PLANT_SELECT},
      b.bioregion_name AS region_name,
      hit.region_inside,
      COALESCE(bp.recommendation_weight, 0)::double precision AS sort_weight
    FROM hit
    INNER JOIN bioregion b ON b.id = hit.bioregion_id
    INNER JOIN bioregion_plant bp ON bp.bioregion_id = b.id
    INNER JOIN plant p ON p.id = bp.plant_id
    LEFT JOIN weed_info wi ON wi.plant_id = p.id
    WHERE wi.plant_id IS NULL
      AND ($5::text = '' OR p.common_name ILIKE $5 OR p.scientific_name ILIKE $5)
      AND (
        cardinality($6::text[]) = 0
        OR EXISTS (
          SELECT 1
          FROM plant_trait pt
          JOIN unnest($6::text[], $7::text[]) AS pair(name, val)
            ON pt.trait_name = pair.name AND pt.trait_value = pair.val
          WHERE pt.plant_id = p.id
        )
      )
    ORDER BY p.id,
             COALESCE(bp.recommendation_weight, 0) DESC NULLS LAST,
             COALESCE(p.common_name, p.scientific_name, '') ASC
  )
  SELECT * FROM dedup
  ORDER BY sort_weight DESC NULLS LAST, scientific_name ASC, id ASC
  LIMIT $3::int OFFSET $4::int
`

/** @param {Record<string, unknown>} r */
function mapPlantRow(r) {
  return {
    id: String(r.id ?? ''),
    scientificName: String(r.scientific_name ?? '').trim(),
    commonName: r.common_name != null ? String(r.common_name).trim() || null : null,
    family: null,
    description: null,
    imageUrl: null,
  }
}

/**
 * @param {import('pg').Pool} pool
 * @param {number} lng
 * @param {number} lat
 * @param {{ limit: number; offset: number; q?: string; wildlife?: string[] }} page
 */
export async function queryRecommendations(pool, lng, lat, page) {
  const { limit, offset } = page
  const term = safeSearchTerm(page.q)
  const like = term ? `%${term}%` : ''
  const fetchLimit = limit + 1
  const wildlife = page.wildlife ?? []
  const { traitNames, traitValues } = wildlifeTraitArrays(wildlife)

  const { rows } = await pool.query(RECOMMENDATIONS_SQL, [
    lng,
    lat,
    fetchLimit,
    offset,
    like,
    traitNames,
    traitValues,
  ])
  const hasMore = rows.length > limit
  const trimmed = hasMore ? rows.slice(0, limit) : rows

  const { regionName, regionMatch } = regionMetaFrom(trimmed[0])

  return {
    regionName,
    regionMatch,
    plants: trimmed.map(mapPlantRow),
    pageSize: limit,
    offset,
    hasMore,
    q: term || null,
    wildlife,
  }
}
