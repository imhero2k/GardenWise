/**
 * Top weeds list (statewide) from PostgreSQL.
 * Does not require bioregion_plant links — uses weed_info + plant.
 */

/** @type {{ sql: string; params: (limit: number, offset: number, q: string) => unknown[] } | null} */
let cachedPlan = null

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

function safeSearchTerm(raw) {
  const t = String(raw ?? '').trim()
  if (!t) return ''
  return t.replace(/[^\p{L}\p{N}\s\-\.'"]/gu, '').slice(0, 60).trim()
}

function plantExprs(plantCols) {
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
  return { commonExpr, sciExpr }
}

/**
 * @param {import('pg').PoolClient} client
 */
export async function ensureTopWeedsPlan(client) {
  if (cachedPlan) return
  const plantCols = await columnSet(client, 'plant')
  const weedCols = await columnSet(client, 'weed_info')
  if (!plantCols.size) throw new Error('Table public.plant not found')
  if (!weedCols.size) throw new Error('Table public.weed_info not found')

  const { commonExpr, sciExpr } = plantExprs(plantCols)

  cachedPlan = {
    sql: `
      WITH rows AS (
        SELECT
          p.id,
          ${sciExpr} AS scientific_name,
          ${commonExpr} AS common_name,
          wi.risk_rating,
          wi.risk_score,
          wi.weed_status_vic,
          wi.is_wons
        FROM weed_info wi
        INNER JOIN plant p ON p.id = wi.plant_id
        WHERE ($3::text = '' OR (${commonExpr} ILIKE $3 OR ${sciExpr} ILIKE $3))
      )
      SELECT * FROM rows
      ORDER BY
        (CASE WHEN is_wons THEN 1 ELSE 0 END) DESC,
        risk_score DESC NULLS LAST,
        risk_rating ASC NULLS LAST,
        common_name ASC NULLS LAST,
        scientific_name ASC,
        id ASC
      LIMIT $1::int OFFSET $2::int`,
    params: (limit, offset, q) => [limit, offset, q],
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

/**
 * @param {import('pg').Pool} pool
 * @param {{ limit: number; offset: number; q?: string }} page
 */
export async function queryTopWeeds(pool, page) {
  const client = await pool.connect()
  try {
    await ensureTopWeedsPlan(client)
    if (!cachedPlan) throw new Error('Top weeds query plan not built')
    const term = safeSearchTerm(page.q)
    const like = term ? `%${term}%` : ''
    const fetchLimit = page.limit + 1
    const { rows: rawRows } = await client.query(cachedPlan.sql, cachedPlan.params(fetchLimit, page.offset, like))
    const hasMore = rawRows.length > page.limit
    const rows = hasMore ? rawRows.slice(0, page.limit) : rawRows
    return {
      weeds: rows.map(mapWeedRow),
      pageSize: page.limit,
      offset: page.offset,
      hasMore,
      q: term || null,
    }
  } finally {
    client.release()
  }
}

