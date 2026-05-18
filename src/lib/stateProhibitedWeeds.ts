export type StateProhibitedWeed = {
  id: string
  name: string
  chinese: string
  emoji: string
  imgUrl: string
  desc: string
  /** Scientific names used for photo-ID matching (lowercase binomial or "genus spp."). */
  scientificNames: string[]
  /** Preferred scientific name for Wikipedia / enrichment lookup. */
  wikipediaQuery: string
}

export const STATE_PROHIBITED_WEEDS: StateProhibitedWeed[] = [
  {
    id: 'alligator-weed',
    name: 'Alligator Weed',
    chinese: '',
    emoji: '🌿',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Alternanthera_philoxeroides_NRCS-1.jpg/330px-Alternanthera_philoxeroides_NRCS-1.jpg',
    desc: 'Alternanthera philoxeroides. Dense floating mats block waterways and farmland; stem fragments root readily, enabling rapid spread downstream. State Prohibited — do not attempt removal yourself.',
    scientificNames: ['alternanthera philoxeroides'],
    wikipediaQuery: 'Alternanthera philoxeroides',
  },
  {
    id: 'salvinia',
    name: 'Salvinia',
    chinese: '',
    emoji: '🌱',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Salvinia_molesta.jpg/330px-Salvinia_molesta.jpg',
    desc: 'Salvinia molesta. Can double in area every 2–3 days. Dense mats deplete oxygen, cause fish kills, and can cover an entire dam in one season. Illegal to buy, sell, or move in Victoria.',
    scientificNames: ['salvinia molesta'],
    wikipediaQuery: 'Salvinia molesta',
  },
  {
    id: 'water-hyacinth',
    name: 'Water Hyacinth',
    chinese: '',
    emoji: '💜',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Eichhornia_crassipes_C.jpg/330px-Eichhornia_crassipes_C.jpg',
    desc: "Eichhornia crassipes. One of the world's most damaging aquatic weeds. Forms dense floating mats that block light, deplete oxygen, and impede watercraft and irrigation infrastructure.",
    scientificNames: ['eichhornia crassipes'],
    wikipediaQuery: 'Eichhornia crassipes',
  },
  {
    id: 'hawkweed',
    name: 'Hawkweed',
    chinese: '',
    emoji: '🌼',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Hieracium_pilosella_plant.jpg/330px-Hieracium_pilosella_plant.jpg',
    desc: 'Pilosella spp. Releases allelopathic chemicals suppressing surrounding plants. Spreads via wind-dispersed seeds and creeping stolons; threatens alpine and sub-alpine native grasslands.',
    scientificNames: [
      'pilosella spp.',
      'hieracium spp.',
      'pilosella pilosella',
      'hieracium pilosella',
      'pilosella officinarum',
    ],
    wikipediaQuery: 'Pilosella pilosella',
  },
  {
    id: 'lagarosiphon',
    name: 'Lagarosiphon',
    chinese: '',
    emoji: '🦆',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Lagarosiphon_major._Howardian%2C_1992_%2830491279833%29.jpg/330px-Lagarosiphon_major._Howardian%2C_1992_%2830491279833%29.jpg',
    desc: 'Lagarosiphon major. Dense underwater mats choke slow-moving water bodies, causing anoxia and fish death. Fragments spread via boats, propellers, and fishing gear between water bodies.',
    scientificNames: ['lagarosiphon major'],
    wikipediaQuery: 'Lagarosiphon major',
  },
  {
    id: 'knotweed',
    name: 'Knotweed',
    chinese: '',
    emoji: '🌾',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Reynoutria_japonica_in_Brastad_1.jpg/330px-Reynoutria_japonica_in_Brastad_1.jpg',
    desc: 'Reynoutria japonica. Extremely aggressive; rhizomes penetrate concrete and building foundations. Near-impossible to eradicate once established. Spreads from fragments as small as 1 cm of root.',
    scientificNames: ['reynoutria japonica', 'fallopia japonica', 'polygonum cuspidatum'],
    wikipediaQuery: 'Reynoutria japonica',
  },
  {
    id: 'mesquite',
    name: 'Mesquite',
    chinese: '',
    emoji: '🌳',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Prosopis_juliflora%2C_known_as_the_Velvet_Mesquite_%2810078437503%29.jpg/330px-Prosopis_juliflora%2C_known_as_the_Velvet_Mesquite_%2810078437503%29.jpg',
    desc: 'Prosopis spp. Aggressive woody shrub forming impenetrable thorny thickets. Deep tap roots deplete groundwater; displaces native vegetation across vast arid and semi-arid areas.',
    scientificNames: ['prosopis spp.'],
    wikipediaQuery: 'Prosopis juliflora',
  },
  {
    id: 'mexican-feather-grass',
    name: 'Mexican Feather Grass',
    chinese: '',
    emoji: '🌾',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Nassella_tenuissima.jpg/330px-Nassella_tenuissima.jpg',
    desc: 'Nassella tenuissima. Highly ornamental but a serious environmental weed. Wind-dispersed seeds spread kilometres; outcompetes native grassland species and significantly increases fire risk.',
    scientificNames: ['nassella tenuissima', 'stipa tenuissima'],
    wikipediaQuery: 'Nassella tenuissima',
  },
  {
    id: 'parthenium-weed',
    name: 'Parthenium Weed',
    chinese: '',
    emoji: '🌼',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Parthenium_hysterophorus_plant_with_flowers.jpg/330px-Parthenium_hysterophorus_plant_with_flowers.jpg',
    desc: 'Parthenium hysterophorus. Causes severe allergic reactions in humans and livestock. Produces allelopathic chemicals that suppress surrounding vegetation; rapidly colonises disturbed land.',
    scientificNames: ['parthenium hysterophorus'],
    wikipediaQuery: 'Parthenium hysterophorus',
  },
  {
    id: 'branched-broomrape',
    name: 'Branched Broomrape',
    chinese: '',
    emoji: '🌡',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Orobanche_ramosaTorrevieja.jpg/330px-Orobanche_ramosaTorrevieja.jpg',
    desc: 'Phelipanche ramosa. A parasitic plant with no chlorophyll; attaches to and destroys roots of crops and native plants. Produces thousands of tiny, long-lived seeds that persist in soil for decades.',
    scientificNames: ['phelipanche ramosa', 'orobanche ramosa'],
    wikipediaQuery: 'Phelipanche ramosa',
  },
  {
    id: 'horsetails',
    name: 'Horsetails',
    chinese: '',
    emoji: '🌿',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Equisetum_telmateia%2C_Ireland_1_-_Ragnhild_%26_Neil_Crawford.jpg/330px-Equisetum_telmateia%2C_Ireland_1_-_Ragnhild_%26_Neil_Crawford.jpg',
    desc: 'Equisetum spp. Ancient lineage and a serious environmental weed; rhizomes extend several metres deep, making removal extremely difficult. Establishes readily in wet areas and spreads aggressively along watercourses.',
    scientificNames: ['equisetum spp.'],
    wikipediaQuery: 'Equisetum arvense',
  },
  {
    id: 'camel-thorn',
    name: 'Camel Thorn',
    chinese: '',
    emoji: '🌵',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Camel-thorn-tree-with-sparrow-weaver-nests.jpg/330px-Camel-thorn-tree-with-sparrow-weaver-nests.jpg',
    desc: 'Vachellia erioloba. Dense thorny thickets reduce pasture productivity and injure livestock. Spreads rapidly via animal-dispersed seed pods; extremely difficult to control once established.',
    scientificNames: ['vachellia erioloba', 'acacia erioloba'],
    wikipediaQuery: 'Vachellia erioloba',
  },
  {
    id: 'karoo-giraffe-thorn',
    name: 'Karoo & Giraffe Thorn',
    chinese: '',
    emoji: '🌳',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Acacia_karroo%2C_habitus%2C_Jimmy_Aves_Park%2C_e.jpg/330px-Acacia_karroo%2C_habitus%2C_Jimmy_Aves_Park%2C_e.jpg',
    desc: 'Vachellia karroo / V. giraffe. Aggressive thorny acacias forming dense stands that exclude native vegetation and restrict stock movement. Seeds dispersed widely by livestock and wildlife.',
    scientificNames: [
      'vachellia karroo',
      'vachellia giraffae',
      'acacia karroo',
      'acacia giraffae',
    ],
    wikipediaQuery: 'Vachellia karroo',
  },
  {
    id: 'poverty-weed',
    name: 'Poverty Weed',
    chinese: '',
    emoji: '🍃',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Iva_axillaris_%284010960273%29_%282%29.jpg/330px-Iva_axillaris_%284010960273%29_%282%29.jpg',
    desc: 'Iva axillaris. Dense colonies crowd out pasture species and crops. Causes contact dermatitis and allergic reactions; pollen triggers hay fever. Spreads aggressively via rhizomes.',
    scientificNames: ['iva axillaris'],
    wikipediaQuery: 'Iva axillaris',
  },
  {
    id: 'tangled-hypericum',
    name: 'Tangled Hypericum',
    chinese: '',
    emoji: '🌡',
    imgUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/%28MHNT%29_Hypericum_androsaemum_-_Habit.jpg/330px-%28MHNT%29_Hypericum_androsaemum_-_Habit.jpg',
    desc: 'Hypericum androsaemum. Shade-tolerant woody shrub forming impenetrable thickets in moist forest and riparian zones. Berries are toxic to livestock and spread by birds into new sites.',
    scientificNames: ['hypericum androsaemum'],
    wikipediaQuery: 'Hypericum androsaemum',
  },
]

export function stateProhibitedWeedElementId(id: string): string {
  return `prohibited-${id}`
}

function normalizeScientificName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function binomialPrefix(name: string): string | null {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`
  return null
}

function matchesScientificPattern(identifyName: string, pattern: string): boolean {
  const id = normalizeScientificName(identifyName)
  const p = normalizeScientificName(pattern)
  if (!id || !p) return false

  if (p.endsWith('spp.') || p.endsWith('spp')) {
    const genus = p.replace(/\s+spp\.?$/, '')
    return id === genus || id.startsWith(`${genus} `)
  }

  if (id === p || id.startsWith(`${p} `)) return true

  const idBin = binomialPrefix(id)
  const pBin = binomialPrefix(p)
  if (idBin && pBin && idBin === pBin) return true

  return false
}

/** Match a scientific name from photo ID to one of Victoria's 15 state prohibited weeds. */
export function matchStateProhibitedWeed(
  scientificName: string | null | undefined,
): StateProhibitedWeed | null {
  const raw = normalizeScientificName(scientificName ?? '')
  if (!raw) return null

  for (const weed of STATE_PROHIBITED_WEEDS) {
    for (const pattern of weed.scientificNames) {
      if (matchesScientificPattern(raw, pattern)) return weed
    }
  }

  return null
}
