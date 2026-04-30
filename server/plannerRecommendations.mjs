/**
 * Goal-based garden planner recommendations from PostgreSQL/PostGIS.
 *
 * This endpoint works from the existing ERD:
 * bioregion -> bioregion_plant -> plant -> plant_trait, excluding weed_info.
 */

const BIRD_GROUPS = [
  {
    id: 'canopy',
    title: 'Canopy layer',
    target: '1 tree species',
    limit: 1,
    reason: 'Canopy trees provide upper-layer structure, shade, and perching space.',
  },
  {
    id: 'mid',
    title: 'Mid-layer shrubs',
    target: '2 shrub species',
    limit: 2,
    reason: 'Shrubs create sheltered movement space between ground and canopy.',
  },
  {
    id: 'ground',
    title: 'Ground layer',
    target: '3 herb, subshrub, or groundcover species',
    limit: 3,
    reason: 'Low flowering plants support understory cover and insect activity.',
  },
  {
    id: 'food',
    title: 'Bird food plants',
    target: 'At least 2 food-resource species',
    limit: 2,
    reason: 'Priority is given to bird-dispersed, fleshy-fruited, or zoochorous species.',
  },
]

const POLLINATOR_GROUPS = [
  {
    id: 'front',
    title: 'Front nectar layer',
    target: '4-6 herb, subshrub, or low shrub species',
    limit: 6,
    min: 4,
    reason: 'Front-layer species carry the main nectar sequence across seasons.',
  },
  {
    id: 'back',
    title: 'Back shelter layer',
    target: '2-3 shrub or tree species',
    limit: 3,
    min: 2,
    reason: 'Shrubs and trees form windbreaks, visual backing, and extra nectar structure.',
  },
  {
    id: 'seasons',
    title: 'Flowering coverage',
    target: 'At least 3 seasons',
    limit: 3,
    reason: 'These species help cover spring, summer, and autumn flowering windows.',
  },
]

function arrayFromPg(raw) {
  if (Array.isArray(raw)) return raw.map((v) => String(v)).filter(Boolean)
  return []
}

function monthArrayFromPg(raw) {
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v)).filter((v) => Number.isInteger(v) && v >= 1 && v <= 12)
  }
  return []
}

function lowerSet(values) {
  return new Set(values.map((v) => String(v).trim().toLowerCase()).filter(Boolean))
}

function seasonForMonth(month) {
  if (month === 12 || month === 1 || month === 2) return 'summer'
  if (month >= 3 && month <= 5) return 'autumn'
  if (month >= 6 && month <= 8) return 'winter'
  return 'spring'
}

function formatSeasonList(months) {
  const order = ['spring', 'summer', 'autumn', 'winter']
  const seasons = new Set(months.map((m) => seasonForMonth(m)))
  return order.filter((s) => seasons.has(s))
}

function baseScore(c) {
  return Number(c.recommendationWeight ?? 0)
}

function hasAny(set, values) {
  return values.some((v) => set.has(v))
}

function birdFoodScore(c) {
  let score = 0
  if (hasAny(c.dispersers, ['birds', 'bird', 'flying_vertebrates'])) score += 4
  if (hasAny(c.fruitFleshiness, ['fleshy'])) score += 4
  if (hasAny(c.dispersalSyndromes, ['zoochory', 'endozoochory'])) score += 3
  if (hasAny(c.dispersers, ['animals', 'vertebrates'])) score += 1
  return score
}

function pollinatorScore(c) {
  let score = 0
  if (c.pollinationSyndromes.has('bee')) score += 4
  if (c.pollinationSyndromes.has('insect')) score += 3
  return score
}

function isCanopy(c) {
  return c.lfCode === 'T' || hasAny(c.growthForms, ['tree', 'mallee'])
}

function isMidLayer(c) {
  return hasAny(c.growthForms, ['shrub']) || ['MS', 'SS', 'PS'].includes(c.lfCode)
}

function isGroundLayer(c) {
  return (
    hasAny(c.growthForms, [
      'herb',
      'subshrub',
      'tussock',
      'graminoid',
      'graminoid_not_tussock',
      'fern',
      'geophyte',
      'hummock',
      'basal_large',
      'climber',
    ]) || ['MH', 'SH', 'LH', 'MTG', 'LTG', 'MNG', 'LNG', 'TTG', 'GF', 'HG', 'SC'].includes(c.lfCode)
  )
}

function isPollinatorFront(c) {
  return (
    hasAny(c.growthForms, [
      'herb',
      'subshrub',
      'tussock',
      'graminoid',
      'graminoid_not_tussock',
      'fern',
      'geophyte',
    ]) || ['MH', 'SH', 'LH', 'MTG', 'LTG', 'MNG', 'LNG', 'TTG', 'GF', 'HG', 'SS', 'PS'].includes(c.lfCode)
  )
}

function isPollinatorBack(c) {
  return isCanopy(c) || isMidLayer(c)
}

function sortByScore(scoreFn) {
  return (a, b) => {
    const score = scoreFn(b) - scoreFn(a)
    if (score !== 0) return score
    const weighted = baseScore(b) - baseScore(a)
    if (weighted !== 0) return weighted
    return a.scientificName.localeCompare(b.scientificName)
  }
}

function plantReason(c, groupId) {
  const bits = []
  if (groupId === 'canopy') bits.push('tree canopy structure')
  if (groupId === 'mid') bits.push('shrub shelter layer')
  if (groupId === 'ground') bits.push('low flowering/understory layer')
  if (groupId === 'front') bits.push('front nectar layer')
  if (groupId === 'back') bits.push('shelter and backdrop layer')
  if (groupId === 'food' && birdFoodScore(c) > 0) bits.push('bird food traits')
  if (groupId === 'seasons') bits.push(`${formatSeasonList(c.floweringMonths).join(', ')} flowering`)
  if (pollinatorScore(c) > 0) bits.push('bee/insect pollination')
  if (c.floweringMonths.length > 0 && groupId !== 'seasons') {
    bits.push(`${formatSeasonList(c.floweringMonths).join(', ')} flowers`)
  }
  return bits.filter(Boolean).slice(0, 3).join('; ') || 'Recommended for this bioregion'
}

function mapPlant(c, groupId) {
  return {
    id: c.id,
    scientificName: c.scientificName,
    commonName: c.commonName,
    lfCode: c.lfCode || null,
    growthForms: [...c.growthForms],
    floweringMonths: c.floweringMonths,
    floweringSeasons: formatSeasonList(c.floweringMonths),
    traits: {
      dispersers: [...c.dispersers],
      fruitFleshiness: [...c.fruitFleshiness],
      dispersalSyndromes: [...c.dispersalSyndromes],
      pollinationSyndromes: [...c.pollinationSyndromes],
    },
    reason: plantReason(c, groupId),
  }
}

function buildBirdGroups(candidates) {
  const canopy = candidates
    .filter(isCanopy)
    .sort(sortByScore((c) => birdFoodScore(c) * 2 + (c.floweringMonths.length ? 1 : 0)))
  const mid = candidates
    .filter(isMidLayer)
    .sort(sortByScore((c) => birdFoodScore(c) * 2 + (c.floweringMonths.length ? 1 : 0)))
  const ground = candidates
    .filter(isGroundLayer)
    .sort(sortByScore((c) => (c.floweringMonths.length ? 4 : 0) + birdFoodScore(c)))
  const food = candidates
    .filter((c) => birdFoodScore(c) > 0)
    .sort(sortByScore(birdFoodScore))

  const byId = { canopy, mid, ground, food }
  return BIRD_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    target: group.target,
    reason: group.reason,
    requiredCount: group.limit,
    plants: (byId[group.id] ?? []).map((p) => mapPlant(p, group.id)),
  }))
}

function buildPollinatorGroups(candidates) {
  const pollinatorCandidates = candidates.filter((c) => pollinatorScore(c) > 0 && c.floweringMonths.length > 0)
  const front = pollinatorCandidates
    .filter(isPollinatorFront)
    .sort(sortByScore((c) => pollinatorScore(c) * 2 + formatSeasonList(c.floweringMonths).length))
  const back = pollinatorCandidates
    .filter(isPollinatorBack)
    .sort(sortByScore((c) => pollinatorScore(c) * 2 + formatSeasonList(c.floweringMonths).length))
  const seasons = pollinatorCandidates
    .filter((c) => formatSeasonList(c.floweringMonths).some((s) => s === 'spring' || s === 'summer' || s === 'autumn'))
    .sort(sortByScore((c) => formatSeasonList(c.floweringMonths).length + pollinatorScore(c)))

  const byId = { front, back, seasons }
  return POLLINATOR_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    target: group.target,
    reason: group.reason,
    requiredCount: group.min ?? group.limit,
    plants: (byId[group.id] ?? []).map((p) => mapPlant(p, group.id)),
  }))
}

function parseCandidate(row) {
  return {
    id: String(row.id),
    scientificName: String(row.scientific_name ?? '').trim(),
    commonName: row.common_name != null ? String(row.common_name).trim() || null : null,
    lfCode: String(row.lf_code ?? '').trim(),
    recommendationWeight: row.recommendation_weight == null ? 0 : Number(row.recommendation_weight) || 0,
    growthForms: lowerSet(arrayFromPg(row.growth_forms)),
    dispersers: lowerSet(arrayFromPg(row.dispersers)),
    fruitFleshiness: lowerSet(arrayFromPg(row.fruit_fleshiness)),
    dispersalSyndromes: lowerSet(arrayFromPg(row.dispersal_syndromes)),
    pollinationSyndromes: lowerSet(arrayFromPg(row.pollination_syndromes)),
    floweringMonths: monthArrayFromPg(row.flowering_months),
  }
}

/**
 * @param {import('pg').Pool} pool
 * @param {'bird' | 'pollinator'} goal
 * @param {number} lng
 * @param {number} lat
 */
export async function queryPlannerRecommendations(pool, goal, lng, lat) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `
      WITH pt AS (
        SELECT ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326) AS g
      ),
      hit AS (
        SELECT s.bioregion_id, s.region_name, s.inside AS region_inside
        FROM (
          SELECT
            b.id AS bioregion_id,
            b.bioregion_name AS region_name,
            ST_Contains(b.boundary, pt.g) AS inside,
            ST_Distance(b.boundary::geography, pt.g::geography) AS dist_m
          FROM bioregion b, pt
          WHERE b.boundary IS NOT NULL
        ) s
        ORDER BY s.inside DESC, s.dist_m ASC, s.bioregion_id ASC
        LIMIT 1
      ),
      candidates AS (
        SELECT
          p.id,
          p.scientific_name,
          p.common_name,
          p.lf_code,
          COALESCE(bp.recommendation_weight, 0)::double precision AS recommendation_weight,
          hit.region_name,
          hit.region_inside
        FROM hit
        INNER JOIN bioregion_plant bp ON bp.bioregion_id = hit.bioregion_id
        INNER JOIN plant p ON p.id = bp.plant_id
        LEFT JOIN weed_info wi ON wi.plant_id = p.id
        WHERE wi.plant_id IS NULL
      )
      SELECT
        c.*,
        array_remove(array_agg(DISTINCT lower(t.trait_value)) FILTER (
          WHERE t.trait_name = 'plant_growth_form' AND t.trait_value IS NOT NULL
        ), NULL) AS growth_forms,
        array_remove(array_agg(DISTINCT lower(t.trait_value)) FILTER (
          WHERE t.trait_name = 'dispersers' AND t.trait_value IS NOT NULL
        ), NULL) AS dispersers,
        array_remove(array_agg(DISTINCT lower(t.trait_value)) FILTER (
          WHERE t.trait_name = 'fruit_fleshiness' AND t.trait_value IS NOT NULL
        ), NULL) AS fruit_fleshiness,
        array_remove(array_agg(DISTINCT lower(t.trait_value)) FILTER (
          WHERE t.trait_name = 'dispersal_syndrome' AND t.trait_value IS NOT NULL
        ), NULL) AS dispersal_syndromes,
        array_remove(array_agg(DISTINCT lower(t.trait_value)) FILTER (
          WHERE t.trait_name = 'pollination_syndrome' AND t.trait_value IS NOT NULL
        ), NULL) AS pollination_syndromes,
        array_remove(array_agg(DISTINCT t.month) FILTER (
          WHERE t.trait_name = 'flowering_time' AND t.present IS TRUE AND t.month IS NOT NULL
        ), NULL) AS flowering_months
      FROM candidates c
      LEFT JOIN plant_trait t ON t.plant_id = c.id
      GROUP BY
        c.id,
        c.scientific_name,
        c.common_name,
        c.lf_code,
        c.recommendation_weight,
        c.region_name,
        c.region_inside
      ORDER BY c.recommendation_weight DESC NULLS LAST, c.scientific_name ASC
      `,
      [lng, lat],
    )

    if (!rows.length) {
      return {
        goal,
        regionName: null,
        regionMatch: null,
        groups: goal === 'bird' ? buildBirdGroups([]) : buildPollinatorGroups([]),
      }
    }

    const first = rows[0]
    const candidates = rows.map(parseCandidate).filter((p) => p.scientificName)
    const groups = goal === 'bird' ? buildBirdGroups(candidates) : buildPollinatorGroups(candidates)

    return {
      goal,
      regionName: first.region_name != null ? String(first.region_name).trim() || null : null,
      regionMatch: first.region_inside === true ? 'contained' : first.region_inside === false ? 'nearest' : null,
      groups,
    }
  } finally {
    client.release()
  }
}
