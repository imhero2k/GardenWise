/**
 * Region-based weeds from PostgreSQL / PostGIS.
 * Uses the same bioregion hit logic as recommendations, but returns only plants that have weed_info.
 */

/** @type {{ sql: string; params: (lng: number, lat: number, limit: number, offset: number, q: string) => unknown[] } | null} */
let cachedPlan = null

/**
 * @param {import('pg').PoolClient} client
 * @param {string} table
 * @param {string[]} [prefer]
 */
async function geometryColumn(client, table, prefer = []) {
  const { rows } = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND udt_name = 'geometry'
     ORDER BY column_name`,
    [table],
  )
  const names = rows.map((r) => r.column_name)
  for (const p of prefer) {
    if (names.includes(p)) return p
  }
  return names[0] ?? null
}

/**
 * @param {import('pg').PoolClient} client
 * @param {string} table
 */
async function columnSet(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  )
  return new Set(rows.map((r) => r.column_name))
}

function bioregionLabelSelect(bioCols) {
  if (bioCols.has('bioregion_name')) return 'b.bioregion_name AS region_name'
  if (bioCols.has('name')) return 'b.name AS region_name'
  return 'NULL::text AS region_name'
}

function safeSearchTerm(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  return t.replace(/[^\p{L}\p{N}\s\-\.'"]/gu, '').slice(0, 60).trim()
}

function plantSelectList(plantCols) {
  const commonExprParts = []
  if (plantCols.has('common_name')) commonExprParts.push('p.common_name')
  if (plantCols.has('vernacular_name')) commonExprParts.push('p.vernacular_name::text')
  if (plantCols.has('name')) commonExprParts.push('p.name::text')
  const commonExpr =
    commonExprParts.length > 0 ? `COALESCE(${commonExprParts.join(', ')})` : `NULL::text`

  const sciParts = []
  if (plantCols.has('scientific_name')) sciParts.push('p.scientific_name')
  if (plantCols.has('sciname')) sciParts.push('p.sciname::text')
  const sciExpr = sciParts.length > 0 ? `COALESCE(${sciParts.join(', ')})` : `NULL::text`

  return {
    commonExpr,
    sciExpr,
    select: `
      p.id,
      ${sciExpr} AS scientific_name,
      ${commonExpr} AS common_name,
      wi.risk_rating,
      wi.risk_score,
      wi.weed_status_vic,
      wi.is_wons
    `.trim(),
  }
}

/**
 * @param {import('pg').PoolClient} client
 */
export async function ensureWeedsPlan(client) {
  if (cachedPlan) return

  const plantCols = await columnSet(client, 'plant')
  const bioCols = await columnSet(client, 'bioregion')
  const bpCols = await columnSet(client, 'bioregion_plant')
  const vbCols = await columnSet(client, 'vic_bioregions')
  const weedCols = await columnSet(client, 'weed_info')

  if (!plantCols.size) throw new Error('Table public.plant not found or has no columns')
  if (!bpCols.has('plant_id') || !bpCols.has('bioregion_id')) {
    throw new Error('public.bioregion_plant must have plant_id and bioregion_id')
  }
  if (!weedCols.size) throw new Error('Table public.weed_info not found')

  const ps = plantSelectList(plantCols)
  const regionSelect = bioregionLabelSelect(bioCols)
  const bioGeom = await geometryColumn(client, 'bioregion', ['boundary', 'geom', 'wkb_geometry'])
  const vbGeom = await geometryColumn(client, 'vic_bioregions', ['geom', 'wkb_geometry'])

  const weightOrder = bpCols.has('recommendation_weight')
    ? 'COALESCE(bp.recommendation_weight, 0) DESC NULLS LAST, '
    : ''

  if (bioGeom) {
    cachedPlan = {
      sql: `
        WITH pt AS (
          SELECT ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326) AS g
        ),
        hit AS (
          SELECT s.bioregion_id, s.inside AS region_inside
          FROM (
            SELECT b.id AS bioregion_id,
              ST_Contains(b.${bioGeom}, pt.g) AS inside,
              ST_Distance(b.${bioGeom}::geography, pt.g::geography) AS dist_m
            FROM bioregion b, pt
          ) s
          ORDER BY s.inside DESC, s.dist_m ASC, s.bioregion_id ASC
          LIMIT 1
        ),
        dedup AS (
          SELECT DISTINCT ON (p.id)
            ${ps.select},
            ${regionSelect},
            hit.region_inside AS region_inside,
            COALESCE(bp.recommendation_weight, 0)::double precision AS sort_weight
          FROM hit
          INNER JOIN bioregion b ON b.id = hit.bioregion_id
          INNER JOIN bioregion_plant bp ON bp.bioregion_id = b.id
          INNER JOIN plant p ON p.id = bp.plant_id
          INNER JOIN weed_info wi ON wi.plant_id = p.id
          WHERE ($5::text = '' OR (${ps.commonExpr} ILIKE $5 OR ${ps.sciExpr} ILIKE $5))
          ORDER BY p.id, ${weightOrder}p.id ASC
        )
        SELECT * FROM dedup
        ORDER BY sort_weight DESC NULLS LAST, scientific_name ASC, id ASC
        LIMIT $3::int OFFSET $4::int`,
      params: (lng, lat, limit, offset, q) => [lng, lat, limit, offset, q],
    }
    return
  }

  if (!vbGeom || !vbCols.size) {
    throw new Error('Need PostGIS geometry on bioregion or vic_bioregions')
  }

  let joinSql
  if (bioCols.has('vic_bioregion_gid')) {
    joinSql = `INNER JOIN bioregion b ON b.vic_bioregion_gid = r.gid`
  } else if (bioCols.has('vic_bioregion_id')) {
    joinSql = `INNER JOIN bioregion b ON b.vic_bioregion_id = r.gid`
  } else if (bioCols.has('bioregion_name') && vbCols.has('bioregion')) {
    joinSql = `INNER JOIN bioregion b ON lower(trim(b.bioregion_name)) = lower(trim(r.name))`
  } else if (bioCols.has('name') && vbCols.has('name')) {
    joinSql = `INNER JOIN bioregion b ON lower(trim(b.name)) = lower(trim(r.name))`
  } else {
    throw new Error('Could not join bioregion to vic_bioregions')
  }

  const vbLabelCol = vbCols.has('bioregion') ? 'vb.bioregion' : vbCols.has('name') ? 'vb.name' : null
  const regionSelectVb = vbLabelCol ? 'r.name AS region_name' : 'NULL::text AS region_name'

  cachedPlan = {
    sql: `
      WITH r AS (
        SELECT vb.gid, ${vbLabelCol ? `${vbLabelCol} AS name` : 'NULL::text AS name'}
        FROM vic_bioregions vb
        WHERE ST_Contains(ST_Transform(vb.${vbGeom}, 4326), ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326))
        LIMIT 1
      ),
      dedup AS (
        SELECT DISTINCT ON (p.id)
          ${ps.select},
          ${regionSelectVb},
          true AS region_inside,
          COALESCE(bp.recommendation_weight, 0)::double precision AS sort_weight
        FROM r
        ${joinSql}
        INNER JOIN bioregion_plant bp ON bp.bioregion_id = b.id
        INNER JOIN plant p ON p.id = bp.plant_id
        INNER JOIN weed_info wi ON wi.plant_id = p.id
        WHERE ($5::text = '' OR (${ps.commonExpr} ILIKE $5 OR ${ps.sciExpr} ILIKE $5))
        ORDER BY p.id, ${weightOrder}p.id ASC
      )
      SELECT * FROM dedup
      ORDER BY sort_weight DESC NULLS LAST, scientific_name ASC, id ASC
      LIMIT $3::int OFFSET $4::int`,
    params: (lng, lat, limit, offset, q) => [lng, lat, limit, offset, q],
  }
}

function mapWeedRow(row) {
  const r = /** @type {Record<string, unknown>} */ (row)
  return {
    id: String(r.id ?? ''),
    scientificName: String(r.scientific_name ?? '').trim(),
    commonName: r.common_name != null ? String(r.common_name).trim() || null : null,
    riskRating: r.risk_rating != null ? String(r.risk_rating).trim() || null : null,
    riskScore: r.risk_score != null ? Number(r.risk_score) : null,
    weedStatusVic: r.weed_status_vic != null ? String(r.weed_status_vic).trim() || null : null,
    isWons: r.is_wons === true,
  }
}

function stripInternalFields(row) {
  const r = /** @type {Record<string, unknown>} */ (row)
  const { sort_weight: _sw, ...rest } = r
  return rest
}

/**
 * @param {import('pg').Pool} pool
 * @param {number} lng
 * @param {number} lat
 * @param {{ limit: number; offset: number; q?: string }} page
 */
export async function queryRegionWeeds(pool, lng, lat, page) {
  const client = await pool.connect()
  try {
    await ensureWeedsPlan(client)
    if (!cachedPlan) throw new Error('Weeds query plan not built')
    const term = safeSearchTerm(page.q)
    const like = term ? `%${term}%` : ''
    const fetchLimit = page.limit + 1
    const params = cachedPlan.params(lng, lat, fetchLimit, page.offset, like)
    const { rows: rawRows } = await client.query(cachedPlan.sql, params)
    const hasMore = rawRows.length > page.limit
    const rows = hasMore ? rawRows.slice(0, page.limit) : rawRows
    const cleaned = rows.map(stripInternalFields)
    const first = /** @type {Record<string, unknown> | undefined} */ (cleaned[0])
    const regionName =
      first?.region_name != null ? String(first.region_name).trim() || null : null
    const ri = first?.region_inside
    const regionMatch = ri === true ? 'contained' : ri === false ? 'nearest' : null
    return {
      regionName,
      regionMatch,
      weeds: cleaned.map(mapWeedRow),
      pageSize: page.limit,
      offset: page.offset,
      hasMore,
      q: term || null,
    }
  } finally {
    client.release()
  }
}

