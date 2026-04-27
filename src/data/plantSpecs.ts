/**
 * Curated catalog of Victorian / Australian native plants for the Garden Planner.
 *
 * All dimensions are approximate MATURE sizes in **metres**. They're intended for
 * spacing and visualisation, not horticultural accuracy — confirm with nursery
 * guidance before planting.
 */

export type PlantForm = 'tree' | 'shrub' | 'grass' | 'groundcover' | 'climber'
export type SunNeed = 'full' | 'part' | 'shade'

export interface PlantSpec {
  id: string
  commonName: string
  scientificName: string
  form: PlantForm
  /** Mature canopy width in metres (how wide it will spread). */
  matureWidth: number
  /** Mature height in metres. */
  matureHeight: number
  /** Recommended minimum spacing between plants of this kind, in metres. */
  recommendedSpacing: number
  sun: SunNeed
  /** Hex colour used for the canopy in the 3D preview. */
  canopyColor: string
  /** Short planting note shown in the planner. */
  note?: string
}

export const PLANT_SPECS: PlantSpec[] = [
  {
    id: 'eucalyptus-leucoxylon',
    commonName: 'Yellow Gum',
    scientificName: 'Eucalyptus leucoxylon',
    form: 'tree',
    matureWidth: 8,
    matureHeight: 15,
    recommendedSpacing: 8,
    sun: 'full',
    canopyColor: '#3d7a3d',
    note: 'Large tree — keep clear of houses, fences and powerlines.',
  },
  {
    id: 'eucalyptus-melliodora',
    commonName: 'Yellow Box',
    scientificName: 'Eucalyptus melliodora',
    form: 'tree',
    matureWidth: 10,
    matureHeight: 20,
    recommendedSpacing: 10,
    sun: 'full',
    canopyColor: '#4a7c46',
    note: 'Very large tree, great for big blocks.',
  },
  {
    id: 'acacia-pycnantha',
    commonName: 'Golden Wattle',
    scientificName: 'Acacia pycnantha',
    form: 'tree',
    matureWidth: 4,
    matureHeight: 6,
    recommendedSpacing: 4,
    sun: 'full',
    canopyColor: '#6f9a47',
  },
  {
    id: 'banksia-integrifolia',
    commonName: 'Coast Banksia',
    scientificName: 'Banksia integrifolia',
    form: 'tree',
    matureWidth: 3,
    matureHeight: 8,
    recommendedSpacing: 3,
    sun: 'full',
    canopyColor: '#527f4a',
  },
  {
    id: 'leptospermum-laevigatum',
    commonName: 'Coast Tea Tree',
    scientificName: 'Leptospermum laevigatum',
    form: 'tree',
    matureWidth: 3,
    matureHeight: 5,
    recommendedSpacing: 3,
    sun: 'full',
    canopyColor: '#6b8e5a',
  },
  {
    id: 'callistemon-citrinus',
    commonName: 'Crimson Bottlebrush',
    scientificName: 'Callistemon citrinus',
    form: 'shrub',
    matureWidth: 2,
    matureHeight: 3,
    recommendedSpacing: 2,
    sun: 'full',
    canopyColor: '#7ba05b',
  },
  {
    id: 'grevillea-robyn-gordon',
    commonName: "Grevillea 'Robyn Gordon'",
    scientificName: 'Grevillea',
    form: 'shrub',
    matureWidth: 2,
    matureHeight: 1.5,
    recommendedSpacing: 1.8,
    sun: 'full',
    canopyColor: '#8ab06a',
    note: 'Attracts honeyeaters; wear gloves when pruning.',
  },
  {
    id: 'westringia-fruticosa',
    commonName: 'Coastal Rosemary',
    scientificName: 'Westringia fruticosa',
    form: 'shrub',
    matureWidth: 1.5,
    matureHeight: 1.5,
    recommendedSpacing: 1.3,
    sun: 'full',
    canopyColor: '#93b08c',
  },
  {
    id: 'correa-reflexa',
    commonName: 'Native Fuchsia',
    scientificName: 'Correa reflexa',
    form: 'shrub',
    matureWidth: 1.2,
    matureHeight: 1,
    recommendedSpacing: 1,
    sun: 'part',
    canopyColor: '#88a673',
  },
  {
    id: 'banksia-spinulosa',
    commonName: 'Hairpin Banksia',
    scientificName: 'Banksia spinulosa',
    form: 'shrub',
    matureWidth: 2,
    matureHeight: 2,
    recommendedSpacing: 1.8,
    sun: 'full',
    canopyColor: '#6d8b52',
  },
  {
    id: 'anigozanthos-flavidus',
    commonName: 'Tall Kangaroo Paw',
    scientificName: 'Anigozanthos flavidus',
    form: 'grass',
    matureWidth: 0.7,
    matureHeight: 1.5,
    recommendedSpacing: 0.6,
    sun: 'full',
    canopyColor: '#b6c97a',
  },
  {
    id: 'dianella-revoluta',
    commonName: 'Black-anther Flax-lily',
    scientificName: 'Dianella revoluta',
    form: 'grass',
    matureWidth: 0.6,
    matureHeight: 0.8,
    recommendedSpacing: 0.5,
    sun: 'part',
    canopyColor: '#9abf67',
  },
  {
    id: 'lomandra-longifolia',
    commonName: 'Spiny-headed Mat-rush',
    scientificName: 'Lomandra longifolia',
    form: 'grass',
    matureWidth: 1,
    matureHeight: 1,
    recommendedSpacing: 0.8,
    sun: 'full',
    canopyColor: '#a3bd72',
  },
  {
    id: 'poa-labillardierei',
    commonName: 'Common Tussock-grass',
    scientificName: 'Poa labillardierei',
    form: 'grass',
    matureWidth: 0.7,
    matureHeight: 1,
    recommendedSpacing: 0.6,
    sun: 'full',
    canopyColor: '#c1cf7f',
  },
  {
    id: 'hardenbergia-violacea',
    commonName: 'Purple Coral Pea',
    scientificName: 'Hardenbergia violacea',
    form: 'climber',
    matureWidth: 2,
    matureHeight: 0.4,
    recommendedSpacing: 1.5,
    sun: 'part',
    canopyColor: '#7590c1',
    note: 'Can scramble as groundcover or be trained up a trellis.',
  },
  {
    id: 'myoporum-parvifolium',
    commonName: 'Creeping Boobialla',
    scientificName: 'Myoporum parvifolium',
    form: 'groundcover',
    matureWidth: 2,
    matureHeight: 0.1,
    recommendedSpacing: 1.5,
    sun: 'full',
    canopyColor: '#9ac78e',
  },
  {
    id: 'brachyscome-multifida',
    commonName: 'Cut-leaf Daisy',
    scientificName: 'Brachyscome multifida',
    form: 'groundcover',
    matureWidth: 0.6,
    matureHeight: 0.3,
    recommendedSpacing: 0.5,
    sun: 'full',
    canopyColor: '#b3cf9e',
  },
  {
    id: 'carex-appressa',
    commonName: 'Tall Sedge',
    scientificName: 'Carex appressa',
    form: 'grass',
    matureWidth: 1,
    matureHeight: 1,
    recommendedSpacing: 0.8,
    sun: 'part',
    canopyColor: '#8cb36d',
    note: 'Loves damp spots and swale edges.',
  },
]

export function findPlantSpec(id: string): PlantSpec | undefined {
  return PLANT_SPECS.find((p) => p.id === id)
}
