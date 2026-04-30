/**
 * Statewide top-weeds list. No bioregion filter; rank by WoNS flag, then risk score.
 * `risk_rating` is TRIMmed in SQL because the source data has at least one row stored
 * as `'Lower Risk '` (trailing space) which would otherwise sort/group separately.
 */

import { safeSearchTerm } from './db.mjs'

const TOP_WEEDS_SQL = /* sql */ `
  WITH base AS (
    SELECT
      p.id,
      p.scientific_name,
      p.common_name,
      TRIM(wi.risk_rating) AS risk_rating,
      wi.risk_score,
      wi.weed_status_vic,
      wi.is_wons
    FROM weed_info wi
    INNER JOIN plant p ON p.id = wi.plant_id
    WHERE ($3::text = '' OR p.common_name ILIKE $3 OR p.scientific_name ILIKE $3)
  )
  SELECT * FROM base
  ORDER BY
    (CASE WHEN is_wons THEN 1 ELSE 0 END) DESC,
    risk_score DESC NULLS LAST,
    risk_rating ASC NULLS LAST,
    common_name ASC NULLS LAST,
    scientific_name ASC,
    id ASC
  LIMIT $1::int OFFSET $2::int
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
 * @param {{ limit: number; offset: number; q?: string }} page
 */
export async function queryTopWeeds(pool, page) {
  const { limit, offset } = page
  const term = safeSearchTerm(page.q)
  const like = term ? `%${term}%` : ''
  const fetchLimit = limit + 1

  const { rows } = await pool.query(TOP_WEEDS_SQL, [fetchLimit, offset, like])
  const hasMore = rows.length > limit
  const trimmed = hasMore ? rows.slice(0, limit) : rows

  return {
    weeds: trimmed.map(mapWeedRow),
    pageSize: limit,
    offset,
    hasMore,
    q: term || null,
  }
}
