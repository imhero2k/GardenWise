import establishDigHoleImg from '../../assets/beginners/establish-dig-hole-2x-width.png'
import establishRemoveFromPotImg from '../../assets/beginners/establish-remove-from-pot.png'
import establishRootBoundImg from '../../assets/beginners/establish-root-bound.png'
import mulchClearOfStemImg from '../../assets/beginners/mulch-clear-of-stem.png'
import mulchDepthImg from '../../assets/beginners/mulch-depth.png'
import mulchTypesImg from '../../assets/beginners/mulch-types.png'
import wateringAtBaseImg from '../../assets/beginners/watering-at-base.png'
import wateringEarlyMorningImg from '../../assets/beginners/watering-early-morning.png'
import attractBirdsHoneyeaterImg from '../../assets/beginners/attract-birds-honeyeater.png'
import attractBirdsSpinebillImg from '../../assets/beginners/attract-birds-spinebill.png'
import attractBirdsWattlebirdImg from '../../assets/beginners/attract-birds-wattlebird.png'
import attractInsectsBeeImg from '../../assets/beginners/attract-insects-bee.png'
import attractInsectsButterflyImg from '../../assets/beginners/attract-insects-butterfly.png'
import attractInsectsLadybirdImg from '../../assets/beginners/attract-insects-ladybird.png'
import attractMammalsFlyingFoxImg from '../../assets/beginners/attract-mammals-flying-fox.png'
import attractMammalsPossumImg from '../../assets/beginners/attract-mammals-possum.png'
import attractMammalsSugarGliderImg from '../../assets/beginners/attract-mammals-sugar-glider.png'

export type TutorialMedia = {
  src: string
  alt: string
  caption: string
}

export type TutorialSectionBody =
  | string
  | {
      lead: string
      beforeLink: string
      link: { label: string; to: string }
      afterLink?: string
    }

export type TutorialTier = 'basic' | 'advanced'

export type TutorialMediaAttribution = {
  beforeLink: string
  link: { label: string; to: string }
  afterLink?: string
}

export type Tutorial = {
  id: string
  tier: TutorialTier
  title: string
  intro: string
  sections?: { title: string; body: TutorialSectionBody[] }[]
  steps: string[]
  /** When true, steps render as plain list items (no "Lead:" bold split). */
  plainSteps?: boolean
  tip?: string[]
  related?: { label: string; to: string }[]
  /** Illustrated steps shown under the intro. */
  media?: TutorialMedia[]
  mediaAttribution?: TutorialMediaAttribution
  mediaPlaceholders?: { label: string }[]
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'your-space',
    tier: 'basic',
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
    tier: 'basic',
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
    tier: 'basic',
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
    tier: 'basic',
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
    related: [
      { label: 'Extreme heat', to: '/beginners/extreme-heat' },
      { label: 'Mulching guide', to: '/beginners/mulching' },
    ],
  },
  {
    id: 'extreme-heat',
    tier: 'advanced',
    title: 'Extreme heat',
    intro:
      'When temperatures spike, even tough natives can struggle if the soil dries out. These steps help you keep moisture in the ground, cut heat stress, and give tender plants temporary relief.',
    sections: [
      {
        title: 'What to do in a heatwave',
        body: [
          {
            lead: 'Watering',
            beforeLink: 'Follow the ',
            link: { label: 'general watering tips', to: '/beginners/watering-guide' },
            afterLink: ' for when and how to water, especially before hot days.',
          },
          {
            lead: 'Mulch well',
            beforeLink: 'See the ',
            link: { label: 'mulching guide', to: '/beginners/mulching' },
            afterLink: ' — a thick mulch layer shields soil from sun and slows evaporation from the surface.',
          },
          'Provide extra shade: younger or newly placed plants usually need more protection than established Australian natives.',
          'Protect raised bed sides: sun on metal sides heats the soil — grow heat-tolerant plants along the outside and keep them pruned tall and narrow, not spreading into the bed.',
          'Relocate pots and seedlings: move trays and pots to shade under trees or shrubs, or indoors for the day if needed.',
          'Keep plants healthy: well-watered, adequately fed plants cope better with extreme weather — the resilience you want year-round.',
        ],
      },
    ],
    steps: [],
    related: [
      { label: 'Extreme cold', to: '/beginners/extreme-cold' },
      { label: 'Watering guide', to: '/beginners/watering-guide' },
      { label: 'Mulching guide', to: '/beginners/mulching' },
    ],
  },
  {
    id: 'extreme-cold',
    tier: 'advanced',
    title: 'Extreme cold',
    intro:
      'Frost can injure or kill plants even when daytime weather feels mild. Understanding how frost works — and where it hits hardest on your block — helps you choose the right plants and reduce damage through winter and early spring.',
    sections: [
      {
        title: 'How to minimise frost damage',
        body: [
          'Use microclimates: established tree canopy and frost-free pockets on your property are the best places for tender plants.',
          'No nitrogen after midsummer: avoid nitrogenous fertiliser from midsummer onward in frost-prone areas — it encourages soft, frost-vulnerable growth.',
          'Keep air moving: do not block cold air at ground level with dense plantings, weeds, hedges, fences or buildings that trap frost pockets.',
          'Keep soils moist: dryness makes frost damage more likely — check moisture before cold snaps.',
          {
            lead: 'Mulch for frost',
            beforeLink: 'In frost-prone spots, gravel or screenings are often better than thick organic mulch, which can trap cold air — see the ',
            link: { label: 'mulching guide', to: '/beginners/mulching' },
            afterLink: ' for mulch types and depth.',
          },
          'Seaweed sprays: sprays on leaves may strengthen cell walls and help plants cope with frost and heat stress.',
        ],
      },
      {
        title: 'Frost facts',
        body: [
          'How frost hurts plants: freezing shrinks cells and ice forms between them; if thawing is slow, tissue loses water and you see “frost burn”.',
          'Sun after frost: rapid thawing plus strong morning sun on still-frozen foliage can make damage worse.',
          'Temperature risk: below about -2°C, many garden plants are at risk of frost damage.',
        ],
      },
    ],
    steps: [],
    related: [
      { label: 'Extreme heat', to: '/beginners/extreme-heat' },
      { label: 'Mulching guide', to: '/beginners/mulching' },
    ],
  },
  {
    id: 'attract-birds',
    tier: 'advanced',
    title: 'Attracting birds',
    plainSteps: true,
    intro:
      'Birds visit gardens that offer food, water, shelter and safe places to nest. A mix of local native plants and simple habitat features can bring regular visitors without turning your yard into a full-time feeding station.',
    media: [
      {
        src: attractBirdsSpinebillImg,
        alt: 'Eastern spinebill with long curved beak feeding among purple tubular flowers',
        caption: 'Eastern spinebill',
      },
      {
        src: attractBirdsWattlebirdImg,
        alt: 'Red wattlebird perched on a bare branch against green foliage',
        caption: 'Red wattlebird',
      },
      {
        src: attractBirdsHoneyeaterImg,
        alt: 'New Holland honeyeater with yellow wing patches on a flowering grevillea',
        caption: 'New Holland honeyeater',
      },
    ],
    sections: [
      {
        title: 'Food through the year',
        body: [
          'Plant layers: combine trees, tall shrubs and smaller plants so different species can feed at different heights — nectar feeders (e.g. banksias, grevilleas, correas), seed eaters (native grasses, hardenbergia) and insect-eaters that hunt among foliage.',
          'Seasonal spread: choose species that flower or fruit across seasons so something is available in autumn and winter, not only in spring.',
          'Let some plants go to seed: resist deadheading every spent flower on seed-producing natives — finches and other seed-eaters will use them.',
          'Insects are bird food: a garden with diverse native plants and minimal pesticide use supports the insects many birds rely on, especially for raising chicks.',
        ],
      },
      {
        title: 'Water and shelter',
        body: [
          'Shallow water: a bird bath or shallow dish with a sloping edge and fresh water (refill and rinse every few days) helps birds drink and bathe safely — add a stick or stone as a perch and escape route.',
          'Dense shrubs: bushy natives (e.g. hop bush, bottlebrush, hakea) give cover from predators and wind; place them near but not tight against windows so birds are not startled into glass.',
          'Nest sites: retain mature trees where safe; install a nest box only if you match the species and entrance size to your area — many small birds prefer natural hollows in old trees.',
        ],
      },
    ],
    steps: [
      'Start with one or two reliable local nectar or seed plants suited to your sun and soil (check PlantMe for your area).',
      'Add a shrub layer for shelter before investing in larger trees — structure matters as much as flower colour.',
      'Provide clean, shallow water and keep cats indoors (especially at dawn and dusk) or contained away from feeding and bathing areas.',
      'Avoid pesticides on plants birds feed from — if you must treat a pest, target the affected plant and choose the least harmful option.',
      'Record what visits across a month and adjust — if honeyeaters dominate, add different flower shapes or lower shrubs for ground-foraging birds.',
    ],
    tip: [
      'Plant local: species native to your bioregion are more likely to support the birds already adapted to your area.',
      'Messy edges help: a strip of leaf litter or prunings under shrubs mimics bushland litter where insects and ground birds forage.',
    ],
    related: [
      { label: 'Attracting insects', to: '/beginners/attract-insects' },
      { label: 'Read your garden', to: '/beginners/your-space' },
      { label: 'More help & resources', to: '/beginners#beginner-resources' },
    ],
  },
  {
    id: 'attract-insects',
    tier: 'advanced',
    title: 'Attracting insects',
    plainSteps: true,
    intro:
      'Insects pollinate flowers, recycle nutrients and feed birds, reptiles and frogs. A native-friendly garden can host a huge variety of bees, butterflies, beetles and other invertebrates when you plant for diversity and reduce chemical use.',
    media: [
      {
        src: attractInsectsLadybirdImg,
        alt: 'Transverse ladybird with orange and black patterned wing covers on a green leaf',
        caption: 'Transverse ladybird',
      },
      {
        src: attractInsectsButterflyImg,
        alt: 'Painted lady butterfly with orange and black wings resting near purple sage flowers',
        caption: 'Painted lady butterfly',
      },
      {
        src: attractInsectsBeeImg,
        alt: 'Blue-banded bee with vivid blue stripes pollinating a pink flowering gum blossom',
        caption: 'Blue-banded bee',
      },
    ],
    mediaAttribution: {
      beforeLink: 'Ladybird photo: ',
      link: {
        label: 'Wikimedia Commons',
        to: 'https://commons.wikimedia.org/wiki/File:Coccinella_transversalis_2.jpg',
      },
      afterLink: ' (Coccinella transversalis).',
    },
    sections: [
      {
        title: 'Flowers and host plants',
        body: [
          'Flower variety: include different colours and shapes (tubular, open daisy-like, flat clusters) — not every pollinator can use the same flower.',
          'Extended seasons: mix early and late flowering species so nectar and pollen are available across the year, not only in spring.',
          'Butterfly host plants: caterpillars need specific leaves (e.g. native grasses for skippers, sedges or pea flowers for others) — without host plants, butterflies may only pass through.',
          'Grasses and sedges: often overlooked; they shelter beetles, provide seeds and support larvae of several butterfly and moth species.',
        ],
      },
      {
        title: 'Habitat on the ground',
        body: [
          'Leaf litter and mulch: a thin layer of organic mulch and some allowed leaf litter gives beetles and ground-nesting bees places to hide and overwinter.',
          'Bare patches: a few small areas of exposed soil (not the whole lawn) can suit ground-nesting native bees — avoid compacting or paving every edge.',
          'Logs and rocks: a partly buried log or rock pile in a quiet corner offers cool, damp refuges for beetles and other decomposers.',
          'Night lighting: bright outdoor lights attract and exhaust flying insects — use motion sensors, warmer bulbs or switch off non-essential lights overnight.',
        ],
      },
    ],
    steps: [
      'Replace a small area of exotic flowering plants with two or three local natives that flower at different times.',
      'Add at least one host plant for butterflies common in your region (nursery staff or council guides can suggest pairs).',
      'Mulch garden beds and leave some fallen leaves under shrubs instead of bare, sprayed soil.',
      'Skip routine broad-spectrum sprays — hand-pick or spot-treat only when a pest is clearly out of balance.',
      'On a warm, calm day, note bees, hoverflies and beetles on flowers and adjust plant choices next season.',
    ],
    tip: [
      '“Bee hotels” can help some species but are not essential — diverse plants and pesticide-free patches matter more for most gardens.',
      'Wasps and flies are pollinators too: many are harmless; learn the few that sting before reaching for spray.',
    ],
    related: [
      { label: 'Attracting birds', to: '/beginners/attract-birds' },
      { label: 'Mulching guide', to: '/beginners/mulching' },
      { label: 'Native plants 101', to: '/learn#native' },
    ],
  },
  {
    id: 'attract-small-mammals',
    tier: 'advanced',
    title: 'Attracting small mammals',
    plainSteps: true,
    intro:
      'Small mammals such as bandicoots, antechinus and various native rodents (where they still occur locally) need cover, safe movement and natural food — not bread or seed left for birds. Even urban gardens can support biodiversity when structure and pets are managed thoughtfully.',
    media: [
      {
        src: attractMammalsPossumImg,
        alt: 'Common ringtail possum with orange-brown fur clinging to branches among green foliage',
        caption: 'Common ringtail possum',
      },
      {
        src: attractMammalsSugarGliderImg,
        alt: 'Sugar glider with grey and white fur gripping a green stem head-down',
        caption: 'Sugar glider',
      },
      {
        src: attractMammalsFlyingFoxImg,
        alt: 'Three grey-headed flying foxes with orange collars hanging from a tree branch',
        caption: 'Grey-headed flying fox',
      },
    ],
    mediaAttribution: {
      beforeLink: 'Ringtail possum photo: ',
      link: {
        label: 'Wikimedia Commons',
        to: 'https://commons.wikimedia.org/wiki/File:Ringtail_Possum._Brisbane.jpg',
      },
      afterLink: ' (Andrew Mercer, CC BY-SA 4.0).',
    },
    sections: [
      {
        title: 'Cover and corridors',
        body: [
          'Ground layer: low dense shrubs, tussock grasses and groundcovers let small animals move hidden from predators and heat.',
          'Gaps and links: if fences are unavoidable, a small wildlife-friendly gap at the base (where safe for pets and neighbours) can connect your garden to adjacent habitat — check local rules before modifying boundaries.',
          'Vertical structure: climbers and mid-height shrubs between taller trees create a three-dimensional maze that many mammals use at night.',
          'Quiet zones: keep one area relatively undisturbed — less foot traffic, mowing and lighting helps shy species use the space.',
        ],
      },
      {
        title: 'Food, water and safety',
        body: [
          'Natural foraging: leaf litter, fallen bark and diverse native plants support insects, fungi and fruits that mammals eat — feeding wildlife directly often causes harm or dependency.',
          'Water at ground level: a shallow dish on the ground (with escape routes) can help in dry weather; keep it away from cat ambush points.',
          'Pet cats: contain cats indoors or in a cat run, especially at night — they are a major pressure on small mammals even in suburbs with bushland nearby.',
          'Dogs: supervise dogs in the garden, especially at dusk; repeated disturbance prevents mammals from settling.',
        ],
      },
    ],
    steps: [
      'Plant a clump of dense, local understorey (shrubs or tussock grasses) in a corner you can leave partly wild.',
      'Add a log or rock pile in shade and allow leaf litter to accumulate underneath — do not collect wood from bushland reserves.',
      'Audit fences and pets — reduce cat access to garden beds and provide ground-level water only in open, escape-friendly spots.',
      'Avoid rodent baits where possible — poisoned rats and mice are eaten by owls, reptiles and mammals, causing secondary poisoning.',
      'Watch with a torch after dark once a fortnight (quietly, from a distance) to see what already visits before adding more structure.',
    ],
    tip: [
      'Expect regional differences: some mammals are protected or rare — never trap or relocate wildlife without expert advice.',
      'Bandicoots and similar diggers are a sign of healthy soil life; a few small holes in mulch are usually worth tolerating.',
    ],
    related: [
      { label: 'Attracting birds', to: '/beginners/attract-birds' },
      { label: 'Attracting insects', to: '/beginners/attract-insects' },
      { label: 'More help & resources', to: '/beginners#beginner-resources' },
    ],
  },
]

export const BASIC_TUTORIALS = TUTORIALS.filter((t) => t.tier === 'basic')
export const ADVANCED_TUTORIALS = TUTORIALS.filter((t) => t.tier === 'advanced')

export function getTutorialById(id: string | undefined): Tutorial | undefined {
  if (!id) return undefined
  return TUTORIALS.find((t) => t.id === id)
}

export function getTutorialsInTier(tier: TutorialTier): Tutorial[] {
  return TUTORIALS.filter((t) => t.tier === tier)
}

