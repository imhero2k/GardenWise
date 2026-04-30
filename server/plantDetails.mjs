/**
 * Single-plant detail lookup. Currently returns identity columns + a derived
 * `wildlifeAttracted: [{ type, species[] }]` summary built from `plant_trait`
 * (dispersers + pollination_syndrome) using the WILDLIFE_CATEGORIES vocabulary.
 */

import { WILDLIFE_CATEGORIES } from './db.mjs'

const PLANT_DETAIL_SQL = /* sql */ `
  SELECT id, scientific_name, common_name FROM plant WHERE id = $1::int
`

const PLANT_WILDLIFE_TRAITS_SQL = /* sql */ `
  SELECT trait_name, trait_value
  FROM plant_trait
  WHERE plant_id = $1::int
    AND trait_name IN ('dispersers', 'pollination_syndrome')
`

const TRAIT_VALUE_LABELS = {
  birds: 'Birds',
  flying_vertebrates: 'Flying vertebrates',
  bird: 'Birds',
  invertebrates: 'Invertebrates',
  ants: 'Ants',
  insect: 'Insects',
  bee: 'Bees',
  mammals: 'Mammals',
  mammal: 'Mammals',
}

const TRAIT_NAME_LABELS = {
  dispersers: 'Seed disperser',
  pollination_syndrome: 'Pollinator',
}

/**
 * @param {Array<{ trait_name: string; trait_value: string }>} traitRows
 * @returns {Array<{ type: string; species: string[] }>}
 */
function buildWildlifeGroups(traitRows) {
  /** key -> Set of species labels */
  const grouped = new Map()
  for (const [catKey, cat] of Object.entries(WILDLIFE_CATEGORIES)) {
    grouped.set(catKey, { type: cat.label, species: new Set() })
  }

  const lookup = new Map()
  for (const [catKey, cat] of Object.entries(WILDLIFE_CATEGORIES)) {
    for (const [name, value] of cat.pairs) {
      const k = `${name}::${value}`
      const existing = lookup.get(k) ?? []
      existing.push(catKey)
      lookup.set(k, existing)
    }
  }

  for (const row of traitRows) {
    const k = `${row.trait_name}::${row.trait_value}`
    const cats = lookup.get(k)
    if (!cats) continue
    const valueLabel =
      TRAIT_VALUE_LABELS[row.trait_value] ??
      row.trait_value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const roleLabel = TRAIT_NAME_LABELS[row.trait_name] ?? row.trait_name
    const species = `${valueLabel} (${roleLabel.toLowerCase()})`
    for (const catKey of cats) grouped.get(catKey).species.add(species)
  }

  /** @type {Array<{ type: string; species: string[] }>} */
  const out = []
  for (const { type, species } of grouped.values()) {
    if (species.size === 0) continue
    out.push({ type, species: [...species].sort() })
  }
  return out
}

/**
 * @param {import('pg').Pool} pool
 * @param {number} id
 */
export async function queryPlantDetails(pool, id) {
  const [{ rows: plantRows }, { rows: traitRows }] = await Promise.all([
    pool.query(PLANT_DETAIL_SQL, [id]),
    pool.query(PLANT_WILDLIFE_TRAITS_SQL, [id]),
  ])
  const plant = plantRows[0]
  if (!plant) return null

  return {
    id: String(plant.id),
    scientificName: String(plant.scientific_name ?? '').trim(),
    commonName:
      plant.common_name != null ? String(plant.common_name).trim() || null : null,
    wildlifeAttracted: buildWildlifeGroups(traitRows),
  }
}
