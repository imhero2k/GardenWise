import { useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface StatCard {
  value: string
  label: string
  source: string
}

interface TopicCard {
  title: string
  points: string[]
}

interface ClassificationTier {
  level: 1 | 2 | 3 | 4
  tag: string
  summary: string
  body: string
}

const STATS: StatCard[] = [
  {
    value: '>50%',
    label: "of Victoria's native vegetation cleared since European settlement",
    source: 'Biodiversity 2037, Ch. 1',
  },
  {
    value: '4,000',
    label: 'habitat hectares lost every year, even with regulations in place',
    source: 'Biodiversity 2037, Ch. 2',
  },
  {
    value: '$283M',
    label: "estimated annual health cost of Melbourne's urban heat island effect",
    source: 'Biodiversity 2037, Ch. 5',
  },
]

const TOPICS: TopicCard[] = [
  {
    title: 'Life-sustaining ecosystem services',
    points: [
      "Victoria's plants, animals, soils and waterways work together as one system.",
      'They produce clean air and water, productive soils, and natural pest control.',
      'They also drive pollination, flood mitigation and carbon sequestration.',
      'Replacing these services with built infrastructure would be \u201Cextremely costly, if not impossible.\u201D',
    ],
  },
  {
    title: 'Physical and mental health',
    points: [
      'Contact with nature speeds recovery from surgery and lowers blood pressure.',
      'It is linked to fewer medications and a stronger immune system.',
      'For children, time in nature builds mental health, resilience and social connections.',
      'Rising urbanisation means fewer people access nature, leading to poorer health outcomes.',
    ],
  },
  {
    title: 'Cooling cities and fighting climate change',
    points: [
      'Native vegetation sequesters carbon over its lifetime.',
      'Shade from trees and shrubs cools streets and homes.',
      'Cooler cities use less energy for air conditioning.',
      'Urban forests of native species reduce the heat-island effect — and cost less than built alternatives.',
    ],
  },
  {
    title: 'Flood and weather resilience',
    points: [
      'Native vegetation soaks up and slows run-off after heavy rain.',
      'This lessens flooding and the damage that follows.',
      "Victoria's parks save an estimated $46 million per year in avoided flood infrastructure costs.",
      'They also deliver $33\u201350 million per year in water-purification benefits.',
    ],
  },
  {
    title: 'Liveable, resilient communities',
    points: [
      'Parks, gardens, street trees and backyards form a connected green network.',
      'These spaces lift liveability and help communities cope with climate change.',
      'Native plants improve air quality and filter stormwater locally.',
      'They reconnect people with nature right where they live.',
    ],
  },
  {
    title: 'Economic value of natural capital',
    points: [
      "Rebuilding Victoria's natural capital could deliver $15\u201336 billion in benefits.",
      'Letting it decline further could cost $16\u201378 billion.',
      'Agriculture, forestry and fisheries depend directly on healthy ecosystems.',
      'Together they contribute around $8 billion to the state economy each year.',
    ],
  },
]

const INVASIVE_STATS: StatCard[] = [
  {
    value: '1,800+',
    label: "environmental weed species listed in Victoria's advisory list (2022)",
    source: 'DEECA / ARI Victoria',
  },
  {
    value: '$24.5B',
    label: 'cost of invasive species to Australia annually \u2014 invasive plants are the single biggest category',
    source: 'CSIRO / NeoBiota, 2021',
  },
  {
    value: '$300M',
    label: 'spent each year on public weed control across national parks and Indigenous lands',
    source: 'Australia State of Environment, 2021',
  },
]

const WHAT_IS_INVASIVE: TopicCard = {
  title: 'What is an invasive plant?',
  points: [
    'An invasive plant \u2014 also called an environmental weed \u2014 is any plant that spreads beyond where it was planted and harms native ecosystems.',
    "Most of Victoria's environmental weeds were introduced from other countries, often deliberately for garden use.",
    'Once established in the wild, they compete with, displace and sometimes completely eliminate the native plants local wildlife depends on.',
    "\u201CInvasive\u201D doesn't simply mean vigorous \u2014 a plant is classed as a weed based on how easily it invades native vegetation, how much damage it causes, and how fast it spreads.",
    "Victoria's government assesses and ranks more than 1,800 weed species on exactly these criteria.",
    "DEECA's Weeds and Pests on Public Land program notes that many of Victoria's worst environmental weeds start out as garden plants \u2014 making every gardener's choices count.",
  ],
}

const HARM_TOPICS: TopicCard[] = [
  {
    title: 'Displacing native plants',
    points: [
      'Invasive plants compete aggressively for light, water and nutrients.',
      'They outcompete native species that evolved over thousands of years for local conditions.',
      'High-impact weeds can dominate entire vegetation layers and cause severe biodiversity loss.',
    ],
  },
  {
    title: 'Disrupting ecological processes',
    points: [
      'Many invasive plants alter fire regimes, water cycles and soil chemistry.',
      'Some changes are so extensive that native ecosystems cannot recover.',
      'Others introduce diseases or alter the soil microbiome that natives rely on.',
    ],
  },
  {
    title: 'Collapsing food webs',
    points: [
      'Native birds, insects, bats and lizards depend on specific native plants for food and shelter.',
      'When weeds replace those natives, the food web that depends on them collapses.',
      'The damage cascades from soil microbes all the way to apex predators.',
    ],
  },
  {
    title: 'Spreading rapidly and silently',
    points: [
      'Seeds spread by wind, water, birds and on clothing or vehicle tyres.',
      'A single garden can seed kilometres of bushland downstream or downwind.',
      'Biodiversity 2037 names invasive plants as a primary cause of decline in every Victorian environment.',
    ],
  },
]

const CLASSIFICATIONS: ClassificationTier[] = [
  {
    level: 1,
    tag: 'State prohibited weed',
    summary: 'Must be eradicated from Victoria',
    body: 'Infestations are still small. The Victorian Government leads eradication and can direct landowners to prevent growth and spread. Trade in these plants is prohibited.',
  },
  {
    level: 2,
    tag: 'Regionally prohibited weed',
    summary: 'Must be managed toward eradication',
    body: 'Not yet widespread in a region but capable of spreading further. Landowners must take all reasonable steps to eradicate these plants from their land.',
  },
  {
    level: 3,
    tag: 'Regionally controlled weed',
    summary: 'Must be controlled and contained',
    body: "Usually widespread in a region. Landowners must take all reasonable steps to prevent growth and spread, even if full eradication isn't currently realistic.",
  },
  {
    level: 4,
    tag: 'Environmental weed (advisory list)',
    summary: 'Flagged for management priority',
    body: "Over 1,800 plants appear on Victoria's 2022 Advisory List of Environmental Weeds, ranked by management urgency. Not all are legally declared, but all pose a risk to native ecosystems.",
  },
]

export function LearnPage() {
  const location = useLocation()

  useLayoutEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    const el = document.getElementById(raw)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, location.pathname])

  return (
    <>
      <div className="learn-divider learn-divider--native" style={{ marginTop: 'var(--space-md)' }}>
        <span className="learn-divider__rule" aria-hidden />
        <div className="learn-divider__label">
          <span className="learn-divider__eyebrow">Victorian Government · Biodiversity 2037</span>
          <span className="learn-divider__brand">Native plants 101</span>
        </div>
        <span className="learn-divider__rule" aria-hidden />
      </div>

      <section className="learn-hero fade-up">
        <div className="learn-hero__inner">
          <h1>Why native plants matter — and what your garden can do</h1>
          <p>
            Victoria&rsquo;s biodiversity is in decline. Over half of the state&rsquo;s native
            vegetation has been cleared since European settlement, and native habitats continue
            to shrink. But your garden can be part of the solution.
          </p>
        </div>
      </section>

      <section className="learn-stats" aria-label="Key biodiversity statistics">
        {STATS.map((stat) => (
          <article className="learn-stat" key={stat.value}>
            <div className="learn-stat__value">{stat.value}</div>
            <p className="learn-stat__label">{stat.label}</p>
            <p className="learn-stat__source">{stat.source}</p>
          </article>
        ))}
      </section>

      <section className="learn-topics" aria-label="How native plants help Victoria">
        {TOPICS.map((topic) => (
          <article className="learn-topic" key={topic.title}>
            <h2>{topic.title}</h2>
            <ul className="learn-topic__list">
              {topic.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="learn-cta">
        <h2>Your garden is part of this plan</h2>
        <p>
          Biodiversity 2037 explicitly identifies planting native gardens as one of the key
          actions Victorians can take to directly protect or enhance biodiversity. The plan&rsquo;s
          goal is for five million Victorians to be actively protecting the natural environment by
          2037 — and your garden counts.
        </p>
        <div className="learn-cta__actions">
          <Link to="/plants" className="btn btn-primary">
            Find native plants for my area
          </Link>
          <Link to="/map" className="btn btn-secondary">
            Find a nursery
          </Link>
        </div>
      </section>

      <div
        id="invasive"
        className="learn-divider learn-divider--invasive"
        style={{ scrollMarginTop: 'var(--space-xl)' }}
      >
        <span className="learn-divider__rule" aria-hidden />
        <div className="learn-divider__label">
          <span className="learn-divider__eyebrow">Garden education</span>
          <span className="learn-divider__brand">Weeds 101</span>
        </div>
        <span className="learn-divider__rule" aria-hidden />
      </div>

      <section className="learn-hero learn-hero--invasive fade-up">
        <div className="learn-hero__inner">
          <p className="learn-hero__eyebrow">Invasive species</p>
          <h2 style={{ color: '#fff', margin: '0 0 var(--space-sm)', fontSize: 'clamp(1.45rem, 3.2vw, 1.8rem)', lineHeight: 1.2 }}>
            Invasive plants in your garden: what they are and why they matter
          </h2>
          <p>
            Many common garden plants sold across Victoria are classified as environmental
            weeds — plants that escape gardens and devastate native ecosystems. Knowing which
            plants are invasive, and why, is one of the most impactful things a Victorian gardener
            can do.
          </p>
        </div>
      </section>

      <section className="learn-stats" aria-label="Key invasive species statistics">
        {INVASIVE_STATS.map((stat) => (
          <article className="learn-stat learn-stat--alt" key={stat.value}>
            <div className="learn-stat__value">{stat.value}</div>
            <p className="learn-stat__label">{stat.label}</p>
            <p className="learn-stat__source">{stat.source}</p>
          </article>
        ))}
      </section>

      <section className="learn-topics" aria-label="What is an invasive plant">
        <article className="learn-topic learn-topic--wide">
          <h2>{WHAT_IS_INVASIVE.title}</h2>
          <ul className="learn-topic__list">
            {WHAT_IS_INVASIVE.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="learn-topic__footer">
            <Link to="/weed#prohibited">See state prohibited weeds &rarr;</Link>
            <Link to="/weed#top-weeds">Browse top weeds in Victoria &rarr;</Link>
          </p>
        </article>
      </section>

      <section className="learn-topics" aria-label="How invasive plants cause harm">
        <h2 className="learn-section-heading">How invasive plants cause harm</h2>
        {HARM_TOPICS.map((topic) => (
          <article className="learn-topic" key={topic.title}>
            <h3>{topic.title}</h3>
            <ul className="learn-topic__list">
              {topic.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="learn-tiers" aria-label="How Victoria classifies invasive plants">
        <h2 className="learn-section-heading">How Victoria classifies invasive plants</h2>
        <p className="learn-section-lead">
          Under Victoria&rsquo;s Catchment and Land Protection Act 1994, invasive plants are
          placed into tiers based on their risk level and the response required of landowners.
        </p>
        <div className="learn-tier-grid">
          {CLASSIFICATIONS.map((c) => (
            <article className={`learn-tier learn-tier--t${c.level}`} key={c.tag}>
              <p className="learn-tier__tag">{c.tag}</p>
              <p className="learn-tier__summary">{c.summary}</p>
              <p className="learn-tier__body">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="learn-cta" aria-label="What you can do in your garden">
        <h2>What you can do in your garden</h2>
        <ul className="learn-topic__list">
          <li>
            <strong>Check plants before you buy.</strong>{' '}
            <Link to="/plants">Search any plant in PlantMe</Link> to see if it appears on
            Victoria&rsquo;s Environmental Weeds Advisory List.
          </li>
          <li>
            <strong>Identify what you already have.</strong>{' '}
            <Link to="/weed#weed-checker">Snap a photo with the Weed checker</Link> if
            you&rsquo;re unsure whether a plant is risky.
          </li>
          <li>
            <strong>Dispose of garden waste responsibly.</strong> Never dump clippings, soil or
            plant material in bushland —{' '}
            <Link to="/weed#disposal">use the disposal guide</Link> for the correct method by
            weed type.
          </li>
          <li>
            <strong>Replace known weeds with locally appropriate native alternatives</strong> —
            our recommendations are tuned to your suburb.
          </li>
          <li>
            <strong>Report new or unusual infestations</strong> through the Victorian Weed
            Spotter Network or the FeralScan app, and follow the{' '}
            <Link to="/weed#rules">general rules</Link> when removing any weed.
          </li>
          <li>
            <strong>Clean boots, tools and vehicle tyres</strong> after visiting natural areas
            so you don&rsquo;t accidentally transport seeds.
          </li>
        </ul>
        <div className="learn-cta__actions">
          <Link to="/weed#weed-checker" className="btn btn-primary">
            Check a plant
          </Link>
          <Link to="/weed#disposal" className="btn btn-secondary">
            Disposal guide
          </Link>
        </div>
      </section>

      <aside className="learn-disclaimer" role="note">
        <strong>Sources:</strong> Native-plant material on this page is summarised from{' '}
        <em>Protecting Victoria&rsquo;s Environment — Biodiversity 2037</em>, published by the
        Victorian Government (Department of Energy, Environment and Climate Action, formerly
        DELWP, 2017, CC BY 4.0). Invasive-species material draws on DEECA / ARI Victoria —{' '}
        <em>Advisory List of Environmental Weeds in Victoria</em> (2022); Agriculture Victoria —{' '}
        <em>Invasive Plants and Animals Policy Framework</em>; DEECA —{' '}
        <em>Weeds and Pests on Public Land Program</em>; CSIRO / NeoBiota (2021); and the{' '}
        <em>Australian State of the Environment</em> (2021). For full detail visit{' '}
        <a
          href="https://www.environment.vic.gov.au/biodiversity/biodiversity-plan"
          target="_blank"
          rel="noopener noreferrer"
        >
          environment.vic.gov.au
        </a>
        . GardenWise is not affiliated with the Victorian Government.
      </aside>
    </>
  )
}
