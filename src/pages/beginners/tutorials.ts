export type Tutorial = {
  id: string
  title: string
  intro: string
  sections?: { title: string; body: string[] }[]
  steps: string[]
  tip?: string[]
  related?: { label: string; to: string }[]
  mediaPlaceholders?: { label: string }[]
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'your-space',
    title: 'Read your garden',
    intro:
      'Natives do best when you match plants to the sunlight, soil and space you already have — no fancy tests required.',
    steps: [
      'Watch how sun moves across a day: note full sun, part shade or deep shade for each bed or pot cluster.',
      'Dig one spadeful of soil and feel it: grittily sandy, sticky clay or somewhere in between shapes watering and plant choice.',
      'Measure bed or pot sizes and picture mature plant width so things are not crammed in two years’ time.',
      'If you are in a cooler part of Victoria, notice frost-prone corners where tender species might struggle.',
    ],
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
    mediaPlaceholders: [
      { label: 'Photo placeholder: digging the hole' },
      { label: 'Photo placeholder: removing plant from pot' },
      { label: 'Photo placeholder: placing and backfilling' },
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
    mediaPlaceholders: [
      { label: 'Photo placeholder: mulch types (organic vs inorganic)' },
      { label: 'Photo placeholder: correct mulch depth' },
      { label: 'Photo placeholder: keep mulch off stems' },
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
    mediaPlaceholders: [
      { label: 'Photo placeholder: finger soil check' },
      { label: 'Photo placeholder: watering at the base' },
      { label: 'Photo placeholder: deep soak vs quick sprinkle' },
    ],
  },
]

export function getTutorialById(id: string | undefined): Tutorial | undefined {
  if (!id) return undefined
  return TUTORIALS.find((t) => t.id === id)
}

