/**
 * Build genus + label → disposal category maps from WeedScan labels.json.
 * Run: node scripts/build-weedscan-disposal-map.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const labelsPath = join(root, 'lambda_weedscan/labels.json')
const outPath = join(root, 'src/data/weedscan-disposal-map.json')

/** @type {const} */
const CATEGORIES = [
  'aquatic',
  'riparian',
  'woody',
  'climbers',
  'grasses',
  'broadleaf',
  'underground',
  'succulents',
]

const PRIORITY = {
  succulents: 0,
  aquatic: 1,
  riparian: 2,
  grasses: 3,
  underground: 4,
  climbers: 5,
  woody: 6,
  broadleaf: 7,
}

const GRASS_GENERA = new Set([
  'Agrostis',
  'Andropogon',
  'Arundo',
  'Avena',
  'Bromus',
  'Cenchrus',
  'Chloris',
  'Cortaderia',
  'Dactyloctenium',
  'Distichlis',
  'Echinochloa',
  'Eragrostis',
  'Heteropogon',
  'Holcus',
  'Hordeum',
  'Hymenachne',
  'Hyparrhenia',
  'Imperata',
  'Lagurus',
  'Lolium',
  'Megathyrsus',
  'Melinis',
  'Nassella',
  'Phalaris',
  'Phragmites',
  'Rottboellia',
  'Sorghum',
  'Sporobolus',
  'Themeda',
  'Urochloa',
  'Vulpia',
])

const SUCCULENT_GENERA = new Set([
  'Agave',
  'Aloe',
  'Austrocylindropuntia',
  'Crassula',
  'Cylindropuntia',
  'Disphyma',
  'Galenia',
  'Harrisia',
  'Kalanchoe',
  'Mesembryanthemum',
  'Opuntia',
  'Pereskia',
  'Sansevieria',
  'Tetragonia',
])

const AQUATIC_GENERA = new Set([
  'Alisma',
  'Alternanthera',
  'Cabomba',
  'Egeria',
  'Elodea',
  'Limnobium',
  'Limnocharis',
  'Myriophyllum',
  'Nymphaea',
  'Pistia',
  'Pontederia',
  'Sagittaria',
  'Salvinia',
  'Stratiotes',
  'Trapa',
])

const UNDERGROUND_GENERA = new Set([
  'Allium',
  'Gloriosa',
  'Moraea',
  'Nothoscordum',
  'Orobanche',
  'Oxalis',
  'Romulea',
  'Sparaxis',
  'Striga',
  'Watsonia',
])

const CLIMBER_GENERA = new Set([
  'Anredera',
  'Araujia',
  'Asparagus',
  'Calystegia',
  'Cardiospermum',
  'Cassytha',
  'Clematis',
  'Convolvulus',
  'Cryptostegia',
  'Dolichandra',
  'Distimake',
  'Gymnocoronis',
  'Hedera',
  'Ipomoea',
  'Lonicera',
  'Mikania',
  'Pandorea',
  'Passiflora',
  'Pueraria',
  'Tradescantia',
  'Vinca',
])

/** Trees, shrubs, and woody legumes in the WeedScan label set. */
const WOODY_GENERA = new Set([
  'Acacia',
  'Acer',
  'Albizia',
  'Berberis',
  'Bursaria',
  'Campsis',
  'Casuarina',
  'Cassinia',
  'Cestrum',
  'Chamaecytisus',
  'Cinnamomum',
  'Cotoneaster',
  'Crataegus',
  'Cytisus',
  'Delonix',
  'Erica',
  'Eugenia',
  'Fraxinus',
  'Genista',
  'Gleditsia',
  'Hakea',
  'Hypericum',
  'Juglans',
  'Koelreuteria',
  'Leptospermum',
  'Leucaena',
  'Ligustrum',
  'Lycium',
  'Malus',
  'Melaleuca',
  'Mimosa',
  'Myoporum',
  'Ochna',
  'Olea',
  'Paraserianthes',
  'Parkinsonia',
  'Pittosporum',
  'Populus',
  'Prosopis',
  'Prunus',
  'Pyracantha',
  'Rhagodia',
  'Rhamnus',
  'Robinia',
  'Rosa',
  'Rubus',
  'Schinus',
  'Searsia',
  'Senna',
  'Sesbania',
  'Solanum',
  'Spathodea',
  'Spartium',
  'Tecoma',
  'Toxicodendron',
  'Trema',
  'Ulex',
  'Vachellia',
  'Verbascum',
  'Ziziphus',
])

const LABEL_OVERRIDES = [
  [/hydrocotyle\s+ranunculoides/i, 'aquatic'],
  [/hymenachne/i, 'grasses'],
  [/equisetum/i, 'broadleaf'],
  [/tamarix/i, 'woody'],
  [/eucalyptus/i, 'woody'],
  [/melaleuca/i, 'woody'],
  [/hakea/i, 'woody'],
]

function normalizeName(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function genusOf(label) {
  return label.trim().split(/\s+/)[0] || ''
}

function classifyLabel(label) {
  for (const [re, cat] of LABEL_OVERRIDES) {
    if (re.test(label)) return cat
  }

  const genus = genusOf(label)
  const lower = label.toLowerCase()

  if (SUCCULENT_GENERA.has(genus)) return 'succulents'
  if (AQUATIC_GENERA.has(genus)) return 'aquatic'
  if (genus === 'Salix') return 'riparian'
  if (GRASS_GENERA.has(genus)) return 'grasses'
  if (UNDERGROUND_GENERA.has(genus)) return 'underground'
  if (CLIMBER_GENERA.has(genus)) return 'climbers'
  if (WOODY_GENERA.has(genus)) return 'woody'

  if (/\b(tree|shrub|wood|lignum)\b/i.test(lower)) return 'woody'
  if (/\b(vine|climber|creeper|scandens|climbing)\b/i.test(lower)) return 'climbers'

  return 'broadleaf'
}

function pickCategory(categories) {
  let best = 'broadleaf'
  let bestPri = PRIORITY['broadleaf']
  for (const c of categories) {
    const p = PRIORITY[c] ?? 99
    if (p < bestPri) {
      best = c
      bestPri = p
    }
  }
  return best
}

const labels = JSON.parse(readFileSync(labelsPath, 'utf8'))
if (!Array.isArray(labels)) throw new Error('labels.json must be an array')

/** @type {Record<string, string>} */
const labelToCategory = {}
/** @type {Map<string, Set<string>>} */
const genusCategories = new Map()

for (const label of labels) {
  const cat = classifyLabel(label)
  labelToCategory[normalizeName(label)] = cat
  const genus = genusOf(label)
  if (!genusCategories.has(genus)) genusCategories.set(genus, new Set())
  genusCategories.get(genus).add(cat)
}

/** @type {Record<string, string>} */
const genusToCategory = {}
for (const [genus, cats] of genusCategories) {
  genusToCategory[genus.toLowerCase()] = pickCategory([...cats])
}

const out = {
  source: 'lambda_weedscan/labels.json',
  labelCount: labels.length,
  genusCount: Object.keys(genusToCategory).length,
  labels: labelToCategory,
  genera: genusToCategory,
}

writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`)
console.log(`Wrote ${outPath} (${out.labelCount} labels, ${out.genusCount} genera)`)
