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

export interface FeatureInfoLink {
  label: string
  url: string
}

/** Rich content shown inline in the catalog when the (i) toggle is opened. */
export interface FeatureInfo {
  /** Intro paragraph rendered as alternating plain / bold spans. */
  introParts: { text: string; bold?: boolean }[]
  /** Headline number/figure for the stat callout (e.g. "1,700+"). */
  stat: string
  /** Caption explaining the stat. */
  statCaption: string
  /** Bullet list under PLACEMENT TIPS. */
  placementTips: string[]
  /** Closing one-line warning / reminder. */
  footer: string
  /** Optional external resources. */
  links?: FeatureInfoLink[]
}

export interface FeatureSpec {
  id: string
  /** Discriminator vs `PlantSpec`. */
  kind: 'feature'
  featureKind: FeatureKind
  category: FeatureCategory
  commonName: string
  /** One-line description shown in the catalog list. */
  description: string
  /** Rich expandable content. */
  info?: FeatureInfo
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
    info: {
      introParts: [
        { text: 'Nest boxes replace the tree hollows that ' },
        { text: 'small parrots, possums, and forest birds', bold: true },
        {
          text:
            ' depend on — hollows that take 100+ years to form naturally. In Victoria, most hollows are found in trees over a century old, which urban gardens rarely have. A well-placed box gives wildlife somewhere to breed and shelter while your canopy trees mature.',
        },
      ],
      stat: '100+',
      statCaption:
        'years for a natural tree hollow to form — most Victorian hollows are in trees over a century old',
      placementTips: [
        'Mount on a stable trunk or strong post',
        'Near canopy or shrubs for cover',
        'Out of harsh afternoon sun',
        'Away from paths, pets, and busy areas',
      ],
      footer: 'Use untreated timber. Avoid placing seed nearby — it attracts pests.',
      links: [
        {
          label: 'Build your own → Birds in Backyards',
          url: 'https://www.birdsinbackyards.net/',
        },
        {
          label: 'Box designs by species → SGA',
          url: 'https://www.sgaonline.org.au/',
        },
      ],
    },
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
    info: {
      introParts: [
        { text: 'Insect hotels attract ' },
        { text: 'native bees, ladybirds, beetles, and spiders', bold: true },
        {
          text:
            ' — vital for pollination and the food web. Bees and beneficial insects use the cavities to rest, lay eggs, and shelter from predators and weather.',
        },
      ],
      stat: '1,700+',
      statCaption:
        'native bee species in Australia, many in decline due to urban habitat loss',
      placementTips: [
        'Mount 1.5–2 m off the ground',
        'Face entrance toward morning sun',
        'Shelter from rain and strong wind',
        'Near (not under) flowering plants',
      ],
      footer: 'Avoid treated wood, plastic tubes, and pesticides nearby.',
      links: [
        {
          label: 'Watch: building a native bee hotel → Gardening Australia',
          url: 'https://www.abc.net.au/gardening/',
        },
      ],
    },
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
    info: {
      introParts: [
        { text: 'Rock piles give ' },
        { text: 'skinks, small lizards, and ground-foraging birds', bold: true },
        {
          text:
            ' warm basking surfaces and cool hiding gaps in one structure. Use a mix of flat rocks for basking and smaller stones to create shelter gaps between them.',
        },
      ],
      stat: '10°C',
      statCaption:
        'of body heat a skink can lose in minutes without a sun-warmed rock to return to',
      placementTips: [
        'Sunny but partly sheltered spot',
        'Beside shrubs or native grasses',
        'Leave gaps between rocks for hiding',
        'Off lawns and walking paths',
      ],
      footer:
        'Choose stable, untreated rocks — no painted or chemically cleaned stone.',
    },
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
    info: {
      introParts: [
        { text: 'Log piles create cool, moist microhabitats for ' },
        { text: 'insects, fungi, lizards, and the small birds', bold: true },
        {
          text:
            ' that forage on them. Unlike a tidy garden bed, a log pile is meant to age — that\'s where the habitat value comes from.',
        },
      ],
      stat: '200+',
      statCaption:
        'invertebrate species a decaying log can host as it returns nutrients to the soil',
      placementTips: [
        'Partly shaded, near groundcover or shrubs',
        'Leave gaps between logs for shelter',
        'Off paths and drains',
        'Let logs decay in place',
      ],
      footer:
        'Use untreated, locally fallen timber. Never collect from protected bushland.',
    },
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
    info: {
      introParts: [
        { text: 'A bird bath is a drinking and bathing station for ' },
        { text: 'honeyeaters, parrots, and small bush birds', bold: true },
        {
          text:
            ' — especially valuable in heatwaves. Raised baths keep birds safer from cats than ground-level water.',
        },
      ],
      stat: '½ body water',
      statCaption:
        'birds can lose on a 40 °C day without a reliable water source',
      placementTips: [
        'Near shrubs for quick escape cover',
        'Not next to dense cat hiding spots',
        'Shallow water, 2–5 cm deep',
        'Add stones inside for grip',
      ],
      footer: 'Refresh water daily in summer. No soap, chemicals, or algae treatments.',
    },
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
    info: {
      introParts: [
        { text: 'A shallow dish offers ground-level water for ' },
        { text: 'bees, butterflies, and small ground-foraging birds', bold: true },
        {
          text:
            ' — wildlife that can\'t reach a raised bath. The simplest habitat feature in the catalog, and one of the most used.',
        },
      ],
      stat: '1–3 cm',
      statCaption:
        'safe water depth for native bees — they drown easily in deeper water and need pebbles to land on',
      placementTips: [
        'Near flowering plants and groundcover',
        'Partly shaded to slow evaporation',
        'Water depth 1–3 cm, no deeper',
        'Add pebbles as insect landing pads',
      ],
      footer: 'Refresh regularly to prevent mosquito breeding.',
    },
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
