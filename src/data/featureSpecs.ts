/**
 * Habitat features (non-plant items) that can be placed in the Garden Planner.
 *
 * Dimensions are in **metres**. Nominal sizes use the midpoint of the design
 * range; ranges are kept on the spec for the placement-tip UI.
 */

export type FeatureKind =
  | 'nestBox'
  | 'insectHotel'
  | 'rockPile'
  | 'logPile'
  | 'birdBath'
  | 'shallowDish'

export type FeatureCategory = 'shelter' | 'water'

/** Drawing primitive used by the 3D scene. */
export type FeatureShape = 'box' | 'pile' | 'pedestal' | 'dish'

export interface FeatureSpec {
  id: string
  /** Discriminator vs `PlantSpec`. */
  kind: 'feature'
  featureKind: FeatureKind
  category: FeatureCategory
  commonName: string
  /** One-line description shown in the catalog list. */
  description: string
  /** Footprint width in metres (used for spacing + footprint ring). */
  matureWidth: number
  /** Total mature height in metres. */
  matureHeight: number
  /** Optional second horizontal dimension (depth) when not square. */
  matureDepth?: number
  /** Recommended minimum spacing between same-kind features, metres. */
  recommendedSpacing: number
  /** Drawing primitive for the 3D scene. */
  shape: FeatureShape
  /** Mounted on a pole (nest box, bird bath, insect hotel) vs ground-only. */
  mount: 'pole' | 'ground'
  /** When `mount === 'pole'`, the pole height in metres. */
  poleHeight?: number
  /** Primary colour. */
  primaryColor: string
  /** Secondary colour (roof, water, etc.). */
  secondaryColor?: string
  /** Human-readable size label (matches the design ranges). */
  sizeLabel: string
  /** Short placement note shown in the bottom info banner. */
  placementNote: string
  /** Tags used by goal progress (bird, pollinator, etc.). */
  habitatTags?: ('bird-shelter' | 'pollinator-shelter' | 'insect-shelter' | 'water')[]
}

export const FEATURE_SPECS: FeatureSpec[] = [
  {
    id: 'feature-nest-box',
    kind: 'feature',
    featureKind: 'nestBox',
    category: 'shelter',
    commonName: 'Nest box',
    description: 'Shelter for parrots, possums, small birds',
    matureWidth: 0.2,
    matureDepth: 0.2,
    matureHeight: 0.3,
    recommendedSpacing: 4,
    shape: 'box',
    mount: 'pole',
    poleHeight: 3,
    primaryColor: '#a07747',
    secondaryColor: '#5b3d22',
    sizeLabel: '20–40 cm H · 15–25 cm W · 15–25 cm D',
    placementNote:
      'Mount 3+ m up on a tree or post, entry facing away from prevailing rain. Avoid full-sun walls.',
    habitatTags: ['bird-shelter'],
  },
  {
    id: 'feature-insect-hotel',
    kind: 'feature',
    featureKind: 'insectHotel',
    category: 'shelter',
    commonName: 'Insect hotel',
    description: 'Shelter for native bees and beneficial insects',
    matureWidth: 0.35,
    matureDepth: 0.15,
    matureHeight: 0.55,
    recommendedSpacing: 1.5,
    shape: 'box',
    mount: 'pole',
    poleHeight: 1.5,
    primaryColor: '#c9a26b',
    secondaryColor: '#8c6a3a',
    sizeLabel: '30–80 cm H · 20–50 cm W · 10–20 cm D',
    placementNote:
      'Mount 1.5–2 m high, facing morning sun, sheltered from rain. Near (not under) flowering shrubs.',
    habitatTags: ['pollinator-shelter', 'insect-shelter'],
  },
  {
    id: 'feature-rock-pile',
    kind: 'feature',
    featureKind: 'rockPile',
    category: 'shelter',
    commonName: 'Rock pile',
    description: 'Ground shelter for skinks and small birds',
    matureWidth: 0.9,
    matureDepth: 0.6,
    matureHeight: 0.45,
    recommendedSpacing: 1.2,
    shape: 'pile',
    mount: 'ground',
    primaryColor: '#9aa0a3',
    secondaryColor: '#6c7174',
    sizeLabel: '60–120 cm L · 40–80 cm W · 30–60 cm H',
    placementNote:
      'Place in a sunny but partly sheltered spot. Mix rock sizes; leave gaps between rocks for cover.',
    habitatTags: ['bird-shelter', 'insect-shelter'],
  },
  {
    id: 'feature-log-pile',
    kind: 'feature',
    featureKind: 'logPile',
    category: 'shelter',
    commonName: 'Log pile',
    description: 'Habitat for insects, fungi, lizards',
    matureWidth: 1.15,
    matureDepth: 0.7,
    matureHeight: 0.55,
    recommendedSpacing: 1.5,
    shape: 'pile',
    mount: 'ground',
    primaryColor: '#7a4f2b',
    secondaryColor: '#4d2f17',
    sizeLabel: '80–150 cm L · 40–100 cm W · 30–80 cm H',
    placementNote:
      'Choose a shaded, undisturbed corner. Use untreated hardwood; let it weather and decay over time.',
    habitatTags: ['insect-shelter'],
  },
  {
    id: 'feature-bird-bath',
    kind: 'feature',
    featureKind: 'birdBath',
    category: 'water',
    commonName: 'Bird bath',
    description: 'Raised water source for birds',
    matureWidth: 0.55,
    matureHeight: 0.9,
    recommendedSpacing: 3,
    shape: 'pedestal',
    mount: 'pole',
    poleHeight: 0.85,
    primaryColor: '#c2cad6',
    secondaryColor: '#5e8db5',
    sizeLabel: '40–70 cm Ø · 5–10 cm water depth',
    placementNote:
      'Open spot with nearby cover (3–5 m away). Refresh water 2–3× per week, scrub weekly.',
    habitatTags: ['water'],
  },
  {
    id: 'feature-shallow-dish',
    kind: 'feature',
    featureKind: 'shallowDish',
    category: 'water',
    commonName: 'Shallow dish',
    description: 'Ground water for small birds & insects',
    matureWidth: 0.3,
    matureHeight: 0.05,
    recommendedSpacing: 1,
    shape: 'dish',
    mount: 'ground',
    primaryColor: '#cfd6dd',
    secondaryColor: '#5e8db5',
    sizeLabel: '20–40 cm Ø · 2–5 cm water depth',
    placementNote:
      'Add a few stones so insects can drink without drowning. Refresh daily in summer.',
    habitatTags: ['water', 'insect-shelter'],
  },
]

export const FEATURE_CATEGORY_LABEL: Record<FeatureCategory, string> = {
  shelter: 'Shelter',
  water: 'Water',
}

export const FEATURE_CATEGORY_ORDER: FeatureCategory[] = ['shelter', 'water']

export function isFeatureSpec(spec: unknown): spec is FeatureSpec {
  return !!spec && typeof spec === 'object' && (spec as FeatureSpec).kind === 'feature'
}
