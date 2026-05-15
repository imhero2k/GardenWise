import establishDigHoleImg from '../../assets/beginners/establish-dig-hole-2x-width.png'
import establishRemoveFromPotImg from '../../assets/beginners/establish-remove-from-pot.png'
import establishRootBoundImg from '../../assets/beginners/establish-root-bound.png'
import mulchClearOfStemImg from '../../assets/beginners/mulch-clear-of-stem.png'
import mulchDepthImg from '../../assets/beginners/mulch-depth.png'
import mulchTypesImg from '../../assets/beginners/mulch-types.png'
import wateringAtBaseImg from '../../assets/beginners/watering-at-base.png'
import wateringEarlyMorningImg from '../../assets/beginners/watering-early-morning.png'

export type TutorialMedia = {
  src: string
  alt: string
  caption: string
}

export type Tutorial = {
  id: string
  title: string
  intro: string
  sections?: { title: string; body: string[] }[]
  steps: string[]
  tip?: string[]
  related?: { label: string; to: string }[]
  /** Illustrated steps shown under the intro. */
  media?: TutorialMedia[]
  mediaPlaceholders?: { label: string }[]
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'your-space',
    title: 'Read your garden',
    intro:
      'Before you choose plants, get a feel for where things are easy to tend, how light and drainage vary, and how you will water—so your natives sit where they can thrive without a fuss.',
    sections: [
      {
        title: 'Convenience',
        body: [
          'Note the areas that are genuinely convenient: spots you see often, can reach with a short walk, and pass by regularly, because those are the best places for plants that need a bit more attention or frequent checks.',
        ],
      },
      {
        title: 'Sunshine',
        body: [
          'If you can, observe the garden every hour or every few hours through a day, or spread checks over several days, and record which patches sit in full sun versus shade and roughly how many hours of direct sun each area receives.',
          'If hourly checks feel too demanding, checking at about 10 a.m., 1 p.m. and 4 p.m. still gives a useful snapshot of how light shifts across the yard.',
        ],
      },
      {
        title: 'Drainage',
        body: [
          'Dig a test hole about 15 cm deep and 40 cm wide, fill it with water, let it drain completely, then fill it again and watch how fast the second fill disappears: if it drops away in minutes the spot is well drained, if it takes around an hour it is moderately drained, and if water lingers for several hours the drainage is poor.',
        ],
      },
      {
        title: 'How to water',
        body: [
          'Think about whether you will realistically use a hose, a watering can, or an automated sprinkler for the size and layout of your garden, and let that choice guide where you cluster thirsty plants versus tough, low-care ones.',
        ],
      },
    ],
    steps: [],
    tip: [
      'When in doubt, pick species labelled for your region in PlantMe — they tolerate typical local winters and dry spells better.',
    ],
  },
  {
    id: 'establish-potted',
    title: 'Establish potted plant in garden',
    intro:
      'A simple method to get a nursery pot settled into the ground with minimal stress and better early growth.',
    steps: [
      'Dig a wide hole: make it about twice the width of the pot so new roots can spread into loosened soil.',
      'Pre-water the plant: water thoroughly while it is still in the pot (or soak the pot in a bucket of water) so the root ball is fully hydrated.',
      'Remove the plant carefully: turn the pot upside down and tap the bottom. Handle it by the root ball, not the trunk or stem.',
      'Transplant and fill: set the plant in the hole, then fill around it with soil loosely and water in well so the soil settles without being packed too tightly and roots can spread.',
      'Consider mulching: add a mulch layer to conserve moisture and reduce weeds (see the mulching guide).',
      'Water regularly at first: keep the soil evenly moist while the plant establishes (see the watering guide for a simple schedule).',
    ],
    tip: [
      'Do not disturb the roots unless the plant is very root-bound.',
      'Root-bound means you can see more roots than soil when you slide the plant out of the pot.',
      'Avoid over-compacting the soil — firm it gently rather than pressing hard.',
    ],
    related: [
      { label: 'Mulching guide', to: '/beginners/mulching' },
      { label: 'Watering guide', to: '/beginners/watering-guide' },
    ],
    media: [
      {
        src: establishRemoveFromPotImg,
        alt: 'Hands tilting a pot and supporting the root ball as a plant is removed',
        caption: 'Remove the plant from the pot while supporting the root ball — handle the soil mass, not the stem.',
      },
      {
        src: establishDigHoleImg,
        alt: 'Plant root ball above a planting hole about twice as wide as the pot',
        caption: 'Dig a hole about twice the width of the pot so roots can spread into loosened soil.',
      },
      {
        src: establishRootBoundImg,
        alt: 'Root-bound plant with dense circling roots shaped like the pot',
        caption: 'Example of a root-bound plant: roots fill the pot and circle tightly — tease gently before planting if needed.',
      },
    ],
  },
  {
    id: 'mulching',
    title: 'Mulching guide',
    intro:
      'Mulch is a protective layer over the soil surface. Done well, it saves water, buffers heat, and reduces weeds while your garden establishes.',
    sections: [
      {
        title: 'Benefits of mulch',
        body: [
          'Conserves moisture: reduces evaporation from the soil surface (especially helpful through hot, dry spells).',
          'Regulates soil temperature: buffers heat and cold, which protects roots and supports steadier growth.',
          'Reduces weeds: blocks light from reaching weed seeds and makes it easier to pull any that sprout.',
          'Improves soil over time (organic mulches): breaks down into organic matter and supports soil life.',
          'Protects soil structure: reduces surface crusting and erosion from heavy rain or watering.',
        ],
      },
    ],
    steps: [
      'Remove existing weeds first: especially any seeding weeds, so you are not mulching over a problem.',
      'Choose a mulch type that fits your goal: organic mulches feed soil as they break down; inorganic mulches last longer but do not improve soil.',
      'For most garden beds, use an organic mulch: e.g. chunky wood mulch, leaf mulch, sugarcane, or pine bark to support soil life and moisture retention.',
      'Spread mulch evenly across the soil surface at about 5–8 cm depth: go a little thinner for very fine mulches so it does not matt down.',
      'Keep mulch clear of trunks and stems: leave a small gap to reduce the risk of collar rot and pests.',
      'After mulching, water the bed: so moisture reaches the soil underneath and the mulch settles in place.',
      'Top up mulch as it breaks down — usually once a year: or whenever you can see bare soil and weeds start to return.',
    ],
    tip: [
      'Organic mulch (wood/leaf/sugarcane) improves soil over time but needs topping up as it decomposes.',
      'Inorganic mulch (gravel/pebbles) is long-lasting and tidy, but can heat up in full sun and will not add organic matter to the soil.',
      'Avoid piling mulch in “volcano” heaps around stems — even good mulch can cause problems if it stays wet against the plant base.',
    ],
    media: [
      {
        src: mulchTypesImg,
        alt: 'Illustrations of straw, pine bark, coir, wood chips, black plastic weed mat, and gravel pebbles mulch',
        caption:
          'Common mulch types include straw, pine bark, coir, and wood chips (organic, they break down and feed soil over time) and black plastic weed mat or gravel (inorganic, longer lasting but do not improve soil).',
      },
      {
        src: mulchDepthImg,
        alt: 'Cross-section showing a plant with a layer of mulch several centimetres deep on the soil surface',
        caption:
          'Spread mulch evenly at about 5–8 cm depth (a little thinner for very fine mulches) so it covers the soil without matting down too thickly.',
      },
      {
        src: mulchClearOfStemImg,
        alt: 'Tree with mulch in a ring around the trunk, leaving a clear gap at the base of the stem',
        caption:
          'Keep mulch clear of trunks and stems — leave a gap so mulch does not sit wet against the plant base (avoid “mulch volcano” heaps).',
      },
    ],
  },
  {
    id: 'watering-guide',
    title: 'Watering guide',
    intro:
      'There is no single perfect schedule — watering depends on weather, soil type, sun exposure, wind, pot size, and how established the plant is. Use the tips below to decide when to water.',
    sections: [
      {
        title: 'General watering tips',
        body: [
          'Water deeply: a slow, deep soak encourages roots to grow down rather than staying near the surface.',
          'Finger test: push a finger into the soil; if it is dry a few centimetres down, it is usually time to water.',
          'Water at the base: aim water at the soil/root zone, not the leaves, to reduce disease and waste.',
          'Morning watering: water early so plants are hydrated before heat and leaves can dry quickly.',
          'Adjust for soil: sandy soils dry quickly (may need more frequent watering), while clay holds water longer (water less often but more deeply).',
          'Let rain do the work: if you have had meaningful rain, skip watering and re-check the soil the next day.',
          'Afternoon wilting: if a plant looks wilted in the heat, check the soil before watering — some plants wilt temporarily but recover by evening.',
        ],
      },
      {
        title: 'Establishment watering (starting point)',
        body: [
          'First week: water daily if the weather is warm or windy, and always check the soil first.',
          'Weeks 2–4: water every 2–3 days, aiming for a deep soak each time.',
          'Months 2–3: water 1–2 times per week, especially through hot or dry periods.',
          'After 3 months: many garden plants need watering only during extended dry spells — keep using the soil check rather than a fixed schedule.',
          'Weather always wins: on rainy or cool weeks, water less; during heatwaves, you may need extra deep soaks.',
        ],
      },
    ],
    steps: [],
    media: [
      {
        src: wateringEarlyMorningImg,
        alt: 'Clock showing 8 a.m. beside a shrub being watered at the base with a watering can',
        caption:
          'Water in the morning when you can — plants take up moisture before the heat of the day and leaves can dry quickly, which helps reduce disease.',
      },
      {
        src: wateringAtBaseImg,
        alt: 'Comparison of overhead watering on leaves marked wrong versus watering at the soil base marked correct',
        caption:
          'Aim water at the soil and root zone, not over the leaves — wet foliage wastes water and can encourage fungal problems; keep the base moist, not the canopy.',
      },
    ],
  },
]

export function getTutorialById(id: string | undefined): Tutorial | undefined {
  if (!id) return undefined
  return TUTORIALS.find((t) => t.id === id)
}

