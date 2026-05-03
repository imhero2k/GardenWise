/**
 * Validates client-submitted planner layout JSON (stored in Dynamo under `payload`).
 * @param {unknown} body
 * @returns {{ ok: true, payload: object } | { ok: false, error: string }}
 */

/**
 * @param {unknown} v
 */
function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

/**
 * Extra `PlantSpec` rows for catalog ids not in bundled `PLANT_SPECS` (e.g. `db-123`).
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null | false} false = invalid, null or {} = omit
 */
function parseOptionalSpecsPatch(raw) {
  if (raw === undefined || raw === null) return {}
  if (typeof raw !== 'object' || Array.isArray(raw)) return false
  const entries = Object.entries(raw)
  if (entries.length > 80) return false

  /** @type {Record<string, unknown>} */
  const out = {}
  for (const [key, val] of entries) {
    if (typeof key !== 'string' || key.length === 0 || key.length > 120) return false
    if (!val || typeof val !== 'object' || Array.isArray(val)) return false
    const s = /** @type {Record<string, unknown>} */ (val)
    const id = typeof s.id === 'string' ? s.id : null
    if (!id || id !== key) return false
    const form = s.form
    if (form !== 'tree' && form !== 'shrub' && form !== 'grass' && form !== 'groundcover' && form !== 'climber') {
      return false
    }
    if (
      typeof s.commonName !== 'string' ||
      typeof s.scientificName !== 'string' ||
      typeof s.canopyColor !== 'string' ||
      typeof s.sun !== 'string'
    )
      return false
    if (!isFiniteNumber(s.matureWidth) || !isFiniteNumber(s.matureHeight) || !isFiniteNumber(s.recommendedSpacing)) {
      return false
    }

    /** @type {Record<string, unknown>} */
    const copy = {
      id,
      commonName: s.commonName,
      scientificName: s.scientificName,
      form,
      matureWidth: s.matureWidth,
      matureHeight: s.matureHeight,
      recommendedSpacing: s.recommendedSpacing,
      sun: s.sun,
      canopyColor: s.canopyColor,
    }
    if (typeof s.note === 'string' && s.note.length <= 2000) copy.note = s.note
    out[key] = copy
  }
  return out
}

export function validatePlannerLayoutPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Body must be a JSON object' }
  }
  const o = /** @type {Record<string, unknown>} */ (body)
  if (o.version !== 1) {
    return { ok: false, error: 'Unsupported layout version (expected 1)' }
  }
  if (typeof o.widthStr !== 'string' || typeof o.depthStr !== 'string') {
    return { ok: false, error: 'widthStr and depthStr must be strings' }
  }
  const goal = o.goal
  if (goal !== 'free' && goal !== 'bird' && goal !== 'pollinator') {
    return { ok: false, error: 'goal must be free, bird, or pollinator' }
  }
  const viewMode = o.viewMode
  if (viewMode !== 'iso' && viewMode !== 'top') {
    return { ok: false, error: 'viewMode must be iso or top' }
  }
  const placed = o.placed
  if (!Array.isArray(placed)) {
    return { ok: false, error: 'placed must be an array' }
  }
  if (placed.length > 200) {
    return { ok: false, error: 'Too many placed plants (max 200)' }
  }
  for (const row of placed) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return { ok: false, error: 'Invalid placed item' }
    }
    const p = /** @type {Record<string, unknown>} */ (row)
    if (typeof p.uid !== 'string' || typeof p.specId !== 'string') {
      return { ok: false, error: 'placed items require uid and specId strings' }
    }
    if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) {
      return { ok: false, error: 'placed items require numeric x and z' }
    }
  }

  const patch = parseOptionalSpecsPatch(o.specsPatch)
  if (patch === false) {
    return { ok: false, error: 'Invalid specsPatch' }
  }

  /** @type {Record<string, unknown>} */
  const payload = {
    version: 1,
    widthStr: o.widthStr,
    depthStr: o.depthStr,
    goal: o.goal,
    viewMode: o.viewMode,
    placed: placed.map((row) => {
      const p = /** @type {Record<string, unknown>} */ (
        typeof row === 'object' && row !== null ? row : {}
      )
      return {
        uid: String(p.uid),
        specId: String(p.specId),
        x: Number(p.x),
        z: Number(p.z),
      }
    }),
  }

  const placedIds = payload.placed.map((row) => String(row.specId))
  /** @type {Set<string>} */
  const uniq = new Set(placedIds)
  if (patch && typeof patch === 'object' && Object.keys(patch).length > 0) {
    for (const k of Object.keys(patch)) {
      if (!uniq.has(k)) {
        return { ok: false, error: 'specsPatch contains id not referenced in placed' }
      }
    }
    payload.specsPatch = patch
  }

  const json = JSON.stringify(payload)
  if (json.length > 350_000) {
    return { ok: false, error: 'Layout payload too large' }
  }

  return { ok: true, payload }
}
