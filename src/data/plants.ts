import type { Plant } from '../types/plant'

export const plants: Plant[] = [
  {
    id: '1',
    name: 'Kangaroo Paw',
    scientificName: 'Anigozanthos spp.',
    image:
      'https://images.unsplash.com/photo-1596547619336-59513be13d6a?w=600&q=80',
    invasiveRisk: 'Low',
    sunlight: 'Full sun',
    water: 'Moderate, well-drained',
    soilPh: 'Slightly acidic to neutral (6.0–7.0)',
    companionsGood: ['Banksia', 'Grevillea', 'Strappy lomandra'],
    companionsBad: ['Heavy shade lovers', 'Plants needing wet feet'],
    seasonalNote: 'Spring–summer flowering; iconic Australian native.',
    seasons: ['Spring', 'Summer', 'Outdoor'],
    tags: ['Native', 'Drought-tolerant'],
  },
  {
    id: '2',
    name: 'English Ivy',
    scientificName: 'Hedera helix',
    image:
      'https://images.unsplash.com/photo-1598514983318-2f32f8d1b969?w=600&q=80',
    invasiveRisk: 'High',
    sunlight: 'Part shade to shade',
    water: 'Moderate; prefers even moisture',
    soilPh: 'Wide range',
    companionsGood: ['None recommended — replace with natives'],
    companionsBad: ['Trees (climbing damage)', 'Structures'],
    seasonalNote: 'Declared weed in parts of Australia; do not plant.',
    seasons: ['Year-round', 'Outdoor'],
    tags: ['Invasive', 'Weed'],
  },
  {
    id: '3',
    name: 'Lemon Myrtle',
    scientificName: 'Backhousia citriodora',
    image:
      'https://images.unsplash.com/photo-1606041011872-d1d4c348b1f5?w=600&q=80',
    invasiveRisk: 'Low',
    sunlight: 'Full sun to part shade',
    water: 'Regular when young; moderate when established',
    soilPh: 'Acidic to neutral',
    companionsGood: ['Finger lime', 'Native shrubs', 'Strawberry gum'],
    companionsBad: ['Plants needing dry, exposed sites'],
    seasonalNote: 'Harvest leaves for tea; frost-sensitive in cold zones.',
    seasons: ['Spring', 'Summer', 'Indoor', 'Outdoor'],
    tags: ['Edible', 'Native'],
  },
  {
    id: '4',
    name: 'Lantana',
    scientificName: 'Lantana camara',
    image:
      'https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=600&q=80',
    invasiveRisk: 'High',
    sunlight: 'Full sun',
    water: 'Drought-tolerant once established',
    soilPh: 'Neutral preferred',
    companionsGood: ['None — remove and replace'],
    companionsBad: ['Bushland edges', 'Riparian zones'],
    seasonalNote: 'Noxious weed in many states; attracts native bees but displaces habitat.',
    seasons: ['Summer', 'Outdoor'],
    tags: ['Weed', 'Noxious'],
  },
  {
    id: '5',
    name: 'Snake Plant',
    scientificName: 'Dracaena trifasciata',
    image:
      'https://images.unsplash.com/photo-1593482896089-25a38b886e4d?w=600&q=80',
    invasiveRisk: 'Medium',
    sunlight: 'Low to bright indirect',
    water: 'Low; allow soil to dry',
    soilPh: 'Slightly acidic to neutral',
    companionsGood: ['ZZ plant', 'Pothos (indoor)', 'Peace lily'],
    companionsBad: ['Outdoor wet tropics (can naturalise)'],
    seasonalNote: 'Great indoor air-purifier; keep contained outdoors in QLD.',
    seasons: ['Year-round', 'Indoor'],
    tags: ['Indoor', 'Low water'],
  },
  {
    id: '6',
    name: 'Correa',
    scientificName: 'Correa spp.',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
    invasiveRisk: 'Low',
    sunlight: 'Part shade to sun',
    water: 'Moderate; mulch roots',
    soilPh: 'Neutral to slightly acidic',
    companionsGood: ['Wattle', 'Dianella', 'Small eucalypts'],
    companionsBad: ['Heavy clay without drainage'],
    seasonalNote: 'Winter flowers; excellent for pollinators.',
    seasons: ['Winter', 'Spring', 'Outdoor'],
    tags: ['Native', 'Pollinator'],
  },
]

export function getPlantById(id: string): Plant | undefined {
  return plants.find((p) => p.id === id)
}

export function searchPlants(query: string): Plant[] {
  const q = query.trim().toLowerCase()
  if (!q) return plants
  return plants.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.scientificName.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  )
}
