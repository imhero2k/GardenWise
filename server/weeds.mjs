/**
 * Region-based weeds: plants in the user's bioregion that have a `weed_info` record.
 * Mirrors `recommendations.mjs` for the geometry hit, but joins INNER on `weed_info`
 * and exposes the risk fields.
 */

import { BIOREGION_HIT_CTE, PLANT_SELECT, regionMetaFrom, safeSearchTerm } from './db.mjs'

const REGION_WEEDS_SQL = /* sql */ `
  WITH ${BIOREGION_HIT_CTE},
  dedup AS (
    SELECT DISTINCT ON (p.id)
      ${PLANT_SELECT},
      TRIM(wi.risk_rating) AS risk_rating,
      wi.risk_score,
      wi.weed_status_vic,
      wi.is_wons,
      b.bioregion_name AS region_name,
      hit.region_inside,
      COALESCE(bp.recommendation_weight, 0)::double precision AS sort_weight
    FROM hit
    INNER JOIN bioregion b ON b.id = hit.bioregion_id
    INNER JOIN bioregion_plant bp ON bp.bioregion_id = b.id
    INNER JOIN plant p ON p.id = bp.plant_id
    INNER JOIN weed_info wi ON wi.plant_id = p.id
    WHERE ($5::text = '' OR p.common_name ILIKE $5 OR p.scientific_name ILIKE $5)
    ORDER BY p.id,
             COALESCE(bp.recommendation_weight, 0) DESC NULLS LAST,
             p.id ASC
  )
  SELECT * FROM dedup
  ORDER BY sort_weight DESC NULLS LAST, scientific_name ASC, id ASC
  LIMIT $3::int OFFSET $4::int
`

/** @param {Record<string, unknown>} r */
function mapWeedRow(r) {
  return {
    id: String(r.id ?? ''),
    scientificName: String(r.scientific_name ?? '').trim(),
    commonName: r.common_name != null ? String(r.common_name).trim() || null : null,
    riskRating: r.risk_rating != null ? String(r.risk_rating).trim() || null : null,
    riskScore: r.risk_score != null ? Number(r.risk_score) : null,
    weedStatusVic:
      r.weed_status_vic != null ? String(r.weed_status_vic).trim() || null : null,
    isWons: r.is_wons === true,
  }
}

/**
 * @param {import('pg').Pool} pool
 * @param {number} lng
 * @param {number} lat
 * @param {{ limit: number; offset: number; q?: string }} page
 */
export async function queryRegionWeeds(pool, lng, lat, page) {
  const { limit, offset } = page
  const term = safeSearchTerm(page.q)
  const like = term ? `%${term}%` : ''
  const fetchLimit = limit + 1

  const { rows } = await pool.query(REGION_WEEDS_SQL, [lng, lat, fetchLimit, offset, like])
  const hasMore = rows.length > limit
  const trimmed = hasMore ? rows.slice(0, limit) : rows

  const { regionName, regionMatch } = regionMetaFrom(trimmed[0])

  return {
    regionName,
    regionMatch,
    weeds: trimmed.map(mapWeedRow),
    pageSize: limit,
    offset,
    hasMore,
    q: term || null,
  }
}
