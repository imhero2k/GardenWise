/**
 * Resolve `plant` + `weed_info` by scientific name (exact, then binomial prefix).
 * Optional bioregion check: whether the plant is linked to the user's bioregion.
 */

import { BIOREGION_HIT_CTE, PLANT_SELECT, safeSearchTerm } from './db.mjs'

/** @param {Record<string, unknown>} r */
function mapRow(r) {
  return {
    id: String(r.id ?? ''),
    scientificName: String(r.scientific_name ?? '').trim(),
    commonName: r.common_name != null ? String(r.common_name).trim() || null : null,
    lfCode: r.lf_code != null ? String(r.lf_code).trim() || null : null,
    riskRating: r.risk_rating != null ? String(r.risk_rating).trim() || null : null,
    riskScore: r.risk_score != null ? Number(r.risk_score) : null,
    weedStatusVic:
      r.weed_status_vic != null ? String(r.weed_status_vic).trim() || null : null,
    isWons: r.is_wons === true,
  }
}

/**
 * @param {import('pg').Pool} pool
 * @param {unknown} rawName
 * @returns {Promise<(ReturnType<typeof mapRow> & { matchKind: 'exact' | 'scientific_prefix' }) | null>}
 */
export async function queryWeedLookupByName(pool, rawName) {
  const name = safeSearchTerm(rawName)
  if (!name) return null

  const exactSql = /* sql */ `
    SELECT ${PLANT_SELECT},
      TRIM(wi.risk_rating) AS risk_rating,
      wi.risk_score,
      wi.weed_status_vic,
      wi.is_wons
    FROM plant p
    INNER JOIN weed_info wi ON wi.plant_id = p.id
    WHERE lower(regexp_replace(trim(p.scientific_name), '\\s+', ' ', 'g'))
       = lower(regexp_replace(trim($1::text), '\\s+', ' ', 'g'))
    LIMIT 1
  `
  let { rows } = await pool.query(exactSql, [name])
  if (rows.length) return { ...mapRow(rows[0]), matchKind: 'exact' }

  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const binomial = `${parts[0]} ${parts[1]}`
    const prefixSql = /* sql */ `
      SELECT ${PLANT_SELECT},
        TRIM(wi.risk_rating) AS risk_rating,
        wi.risk_score,
        wi.weed_status_vic,
        wi.is_wons
      FROM plant p
      INNER JOIN weed_info wi ON wi.plant_id = p.id
      WHERE lower(p.scientific_name) LIKE lower($1::text) || '%'
      ORDER BY length(p.scientific_name) ASC
      LIMIT 1
    `
    ;({ rows } = await pool.query(prefixSql, [binomial]))
    if (rows.length) return { ...mapRow(rows[0]), matchKind: 'scientific_prefix' }
  }

  return null
}

/**
 * @param {import('pg').Pool} pool
 * @param {number} lng
 * @param {number} lat
 * @param {string | number} plantId
 */
export async function queryPlantListedInBioregion(pool, lng, lat, plantId) {
  const id = parseInt(String(plantId), 10)
  if (!Number.isInteger(id) || id <= 0) return false
  const sql = /* sql */ `
    WITH ${BIOREGION_HIT_CTE}
    SELECT EXISTS (
      SELECT 1
      FROM hit
      INNER JOIN bioregion_plant bp ON bp.bioregion_id = hit.bioregion_id AND bp.plant_id = $3::int
    ) AS ok
  `
  const { rows } = await pool.query(sql, [lng, lat, id])
  return rows[0]?.ok === true
}
