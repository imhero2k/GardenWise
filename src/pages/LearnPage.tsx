import { Link } from 'react-router-dom'

interface StatCard {
  value: string
  label: string
  source: string
}

interface TopicCard {
  title: string
  points: string[]
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

export function LearnPage() {
  return (
    <>
      <header className="top-bar">
        <span className="app-brand">Native plants 101</span>
      </header>

      <section className="learn-hero fade-up">
        <div className="learn-hero__inner">
          <p className="learn-hero__eyebrow">Victorian Government · Biodiversity 2037</p>
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

      <aside className="learn-disclaimer" role="note">
        <strong>Source:</strong> Statistics and themes on this page are summarised from{' '}
        <em>Protecting Victoria&rsquo;s Environment — Biodiversity 2037</em>, published by the
        Victorian Government (Department of Energy, Environment and Climate Action). For full
        detail visit{' '}
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
