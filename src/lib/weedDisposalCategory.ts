import weedscanDisposalMap from '../data/weedscan-disposal-map.json'

export type WeedCategory =
  | 'aquatic'
  | 'riparian'
  | 'woody'
  | 'climbers'
  | 'grasses'
  | 'broadleaf'
  | 'underground'
  | 'succulents'

export const WEED_DISPOSAL_TYPE_LABELS: Record<WeedCategory, string> = {
  aquatic: 'Aquatic & Wetland Herbaceous',
  riparian: 'Riparian Woody Plants',
  woody: 'Terrestrial Woody Shrubs & Trees',
  climbers: 'Climbers & Creeping Groundcovers',
  grasses: 'Grasses & Grass-like',
  broadleaf: 'Non-woody Broadleaf Herbs',
  underground: 'Underground Storage Perennials',
  succulents: 'Succulents & Cacti',
}

const LABEL_TO_CATEGORY = weedscanDisposalMap.labels as Record<string, WeedCategory>
const GENUS_TO_CATEGORY = weedscanDisposalMap.genera as Record<string, WeedCategory>

/** Map Victorian life-form codes to disposal guide categories (best-effort). */
const LF_CODE_TO_CATEGORY: Record<string, WeedCategory> = {
  MTG: 'grasses',
  LTG: 'grasses',
  MNG: 'grasses',
  LNG: 'grasses',
  TTG: 'grasses',
  SC: 'climbers',
  HG: 'climbers',
  EP: 'climbers',
  MS: 'woody',
  SS: 'woody',
  PS: 'woody',
  T: 'woody',
  MH: 'broadleaf',
  SH: 'broadleaf',
  LH: 'broadleaf',
  GF: 'broadleaf',
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function genusFromScientificName(scientificName: string | null | undefined): string | null {
  const first = String(scientificName ?? '')
    .trim()
    .split(/\s+/)[0]
  return first || null
}

function binomialPrefix(name: string): string | null {
  const parts = normalizeName(name).split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
  return null
}

/** Match photo-ID / database name to a WeedScan label, then return its disposal category. */
function categoryFromWeedscanLabels(scientificName: string): WeedCategory | null {
  const norm = normalizeName(scientificName)
  if (!norm) return null

  const exact = LABEL_TO_CATEGORY[norm]
  if (exact) return exact

  const binomial = binomialPrefix(norm)
  if (binomial) {
    const hit = LABEL_TO_CATEGORY[binomial]
    if (hit) return hit
  }

  for (const [label, category] of Object.entries(LABEL_TO_CATEGORY)) {
    if (norm === label || norm.startsWith(`${label} `)) return category
    if (label.startsWith(`${norm} `)) return category
  }

  return null
}

/**
 * Infer disposal guide category from weed DB life-form code and/or scientific name.
 * Scientific names are matched against WeedScan model labels (see weedscan-disposal-map.json).
 */
export function inferWeedDisposalCategory(
  lfCode: string | null | undefined,
  scientificName: string | null | undefined,
): WeedCategory | null {
  const name = String(scientificName ?? '').trim()
  if (name) {
    const fromLabel = categoryFromWeedscanLabels(name)
    if (fromLabel) return fromLabel
  }

  const genus = genusFromScientificName(scientificName)
  if (genus) {
    const fromGenus = GENUS_TO_CATEGORY[genus.toLowerCase()]
    if (fromGenus) return fromGenus
  }

  const code = String(lfCode ?? '')
    .trim()
    .toUpperCase()
  if (code && LF_CODE_TO_CATEGORY[code]) return LF_CODE_TO_CATEGORY[code]

  return null
}

export function weedDisposalTypeLabel(category: WeedCategory): string {
  return WEED_DISPOSAL_TYPE_LABELS[category]
}

/** Regenerate map after editing labels: `node scripts/build-weedscan-disposal-map.mjs` */
export const WEEDSCAN_DISPOSAL_MAP_META = {
  source: weedscanDisposalMap.source,
  labelCount: weedscanDisposalMap.labelCount,
  genusCount: weedscanDisposalMap.genusCount,
}
