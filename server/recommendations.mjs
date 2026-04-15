/**
 * Coordinate-based plant recommendations from PostgreSQL / PostGIS.
 *
 * Strategy (GardenWise RDS / dump schema):
 * 1. Bioregion: prefer ST_Contains(boundary, point); if none (coastal/gaps), use nearest
 *    boundary by geography distance. Then bioregion_plant → plant. Label = bioregion_name.
 * 2. Sort by bioregion_plant.recommendation_weight DESC (higher first) when present.
 * 3. Fallback only if bioregion has no geometry: vic_bioregions.geom (often SRID 7844) with
 *    ST_Transform(…, 4326) for containment vs the same WGS84 point.
 *    Join bioregion.bioregion_name ↔ vic_bioregions.bioregion (not generic "name" on both).
 */

/** @type {{ sql: string; params: (lng: number, lat: number, limit: number, offset: number, q: string) => unknown[] } | null} */
let cachedPlan = null

/**
 * @param {import('pg').PoolClient} client
 * @param {string} table
 * @param {string[]} [prefer] — use first name that exists (e.g. ['boundary', 'geom'])
 * @returns {Promise<string | null>}
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
 * @param {Set<string>} bioCols
 */
function bioregionLabelSelect(bioCols) {
  if (bioCols.has('bioregion_name')) return 'b.bioregion_name AS region_name'
  if (bioCols.has('name')) return 'b.name AS region_name'
  return 'NULL::text AS region_name'
}

/**
 * @param {import('pg').PoolClient} client
 * @param {string} table
 * @returns {Promise<Set<string>>}
 */
async function columnSet(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  )
  return new Set(rows.map((r) => r.column_name))
}

/**
 * @param {Set<string>} plantCols
 */
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

  const familyExpr = plantCols.has('family') ? 'p.family' : 'NULL::text'
  const descExpr = plantCols.has('description') ? 'p.description' : 'NULL::text'
  const imgExpr = plantCols.has('image_url')
    ? 'p.image_url'
    : plantCols.has('image')
      ? 'p.image'
      : 'NULL::text'

  return {
    commonExpr,
    sciExpr,
    select: `
      p.id,
      ${sciExpr} AS scientific_name,
      ${commonExpr} AS common_name,
      ${familyExpr} AS family,
      ${descExpr} AS description,
      ${imgExpr} AS image_url
    `.trim(),
    orderBy: `COALESCE(${commonExpr}, ${sciExpr}, '')`,
  }
}

function safeSearchTerm(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  // Keep this conservative to avoid heavy wildcard scans.
  return t.replace(/[^\p{L}\p{N}\s\-\.'"]/gu, '').slice(0, 60).trim()
}

/**
 * @param {import('pg').PoolClient} client
 * @returns {Promise<void>}
 */
export async function ensurePlan(client) {
  if (cachedPlan) return

  const plantCols = await columnSet(client, 'plant')
  const bioCols = await columnSet(client, 'bioregion')
  const bpCols = await columnSet(client, 'bioregion_plant')
  const vbCols = await columnSet(client, 'vic_bioregions')

  if (!plantCols.size) throw new Error('Table public.plant not found or has no columns')
  if (!bpCols.has('plant_id') || !bpCols.has('bioregion_id')) {
    throw new Error('public.bioregion_plant must have plant_id and bioregion_id')
  }

  const ps = plantSelectList(plantCols)
  const bioGeom = await geometryColumn(client, 'bioregion', ['boundary', 'geom', 'wkb_geometry'])
  const vbGeom = await geometryColumn(client, 'vic_bioregions', ['geom', 'wkb_geometry'])

  if (bioGeom) {
    const regionSelect = bioregionLabelSelect(bioCols)
    const weightOrder = bpCols.has('recommendation_weight')
      ? 'COALESCE(bp.recommendation_weight, 0) DESC NULLS LAST, '
      : ''
    const sortWeightExpr = bpCols.has('recommendation_weight')
      ? 'COALESCE(bp.recommendation_weight, 0)::double precision'
      : '0::double precision'
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
            ${sortWeightExpr} AS sort_weight
          FROM hit
          INNER JOIN bioregion b ON b.id = hit.bioregion_id
          INNER JOIN bioregion_plant bp ON bp.bioregion_id = b.id
          INNER JOIN plant p ON p.id = bp.plant_id
          LEFT JOIN weed_info wi ON wi.plant_id = p.id
          WHERE wi.plant_id IS NULL
            AND ($5::text = '' OR (${ps.commonExpr} ILIKE $5 OR ${ps.sciExpr} ILIKE $5))
          ORDER BY p.id, ${weightOrder}${ps.orderBy} ASC
        )
        SELECT * FROM dedup
        ORDER BY sort_weight DESC NULLS LAST, scientific_name ASC, id ASC
        LIMIT $3::int OFFSET $4::int`,
      params: (lng, lat, limit, offset, q) => [lng, lat, limit, offset, q],
    }
    return
  }

  if (!vbGeom || !vbCols.size) {
    throw new Error(
      'Need PostGIS geometry on public.bioregion (e.g. boundary) or public.vic_bioregions.geom.',
    )
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
    throw new Error(
      'Could not join bioregion to vic_bioregions: add bioregion.vic_bioregion_gid (int) or matching names (bioregion_name ↔ bioregion).',
    )
  }

  const vbLabelCol = vbCols.has('bioregion') ? 'vb.bioregion' : vbCols.has('name') ? 'vb.name' : null
  const regionSelect = vbLabelCol ? 'r.name AS region_name' : 'NULL::text AS region_name'

  const weightOrder = bpCols.has('recommendation_weight')
    ? 'COALESCE(bp.recommendation_weight, 0) DESC NULLS LAST, '
    : ''

  const sortWeightExprVb = bpCols.has('recommendation_weight')
    ? 'COALESCE(bp.recommendation_weight, 0)::double precision'
    : '0::double precision'
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
          ${regionSelect},
          true AS region_inside,
          ${sortWeightExprVb} AS sort_weight
        FROM r
        ${joinSql}
        INNER JOIN bioregion_plant bp ON bp.bioregion_id = b.id
        INNER JOIN plant p ON p.id = bp.plant_id
        LEFT JOIN weed_info wi ON wi.plant_id = p.id
        WHERE wi.plant_id IS NULL
          AND ($5::text = '' OR (${ps.commonExpr} ILIKE $5 OR ${ps.sciExpr} ILIKE $5))
        ORDER BY p.id, ${weightOrder}${ps.orderBy} ASC
      )
      SELECT * FROM dedup
      ORDER BY sort_weight DESC NULLS LAST, scientific_name ASC, id ASC
      LIMIT $3::int OFFSET $4::int`,
    params: (lng, lat, limit, offset, q) => [lng, lat, limit, offset, q],
  }
}

/**
 * @param {unknown} row
 */
function mapRow(row) {
  const r = /** @type {Record<string, unknown>} */ (row)
  return {
    id: String(r.id ?? ''),
    scientificName: String(r.scientific_name ?? '').trim(),
    commonName: r.common_name != null ? String(r.common_name).trim() || null : null,
    family: r.family != null ? String(r.family).trim() || null : null,
    description: r.description != null ? String(r.description).trim() || null : null,
    imageUrl: r.image_url != null ? String(r.image_url).trim() || null : null,
  }
}

/** Strip internal sort column before JSON. */
function stripInternalFields(row) {
  const r = /** @type {Record<string, unknown>} */ (row)
  const { sort_weight: _sw, ...rest } = r
  return rest
}

/**
 * @param {import('pg').Pool} pool
 * @param {number} lng
 * @param {number} lat
 * @param {{ limit: number; offset: number }} page
 */
export async function queryRecommendations(pool, lng, lat, page) {
  const client = await pool.connect()
  try {
    await ensurePlan(client)
    if (!cachedPlan) throw new Error('Query plan not built')
    const { limit, offset } = page
    const term = safeSearchTerm(page.q)
    const like = term ? `%${term}%` : ''
    const fetchLimit = limit + 1
    const params = cachedPlan.params(lng, lat, fetchLimit, offset, like)
    const { rows: rawRows } = await client.query(cachedPlan.sql, params)
    const hasMore = rawRows.length > limit
    const rows = hasMore ? rawRows.slice(0, limit) : rawRows
    const cleaned = rows.map(stripInternalFields)
    const first = /** @type {Record<string, unknown> | undefined} */ (cleaned[0])
    const regionName =
      first?.region_name != null ? String(first.region_name).trim() || null : null
    const ri = first?.region_inside
    const regionMatch =
      ri === true ? 'contained' : ri === false ? 'nearest' : null
    const plants = cleaned.map((row) => mapRow(row))
    return {
      regionName,
      regionMatch,
      plants,
      pageSize: limit,
      offset,
      hasMore,
      q: term || null,
    }
  } finally {
    client.release()
  }
}

export function resetPlanCache() {
  cachedPlan = null
}
