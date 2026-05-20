import { useLayoutEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { LearnMechIcon, learnIconKindFor } from '../components/LearnMechIcons'

interface StatCard {
  value: string
  label: string
  source: string
}

interface TopicCard {
  title: string
  points: string[]
  /** Optional one-line subline rendered in primary color under the H3. */
  subline?: string
  /** Optional "What this looks like" takeaway. */
  takeaway?: string
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
      'Replacing these services with built infrastructure would be “extremely costly, if not impossible.”',
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
      'They also deliver $33–50 million per year in water-purification benefits.',
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
      "Rebuilding Victoria's natural capital could deliver $15–36 billion in benefits.",
      'Letting it decline further could cost $16–78 billion.',
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
    label: 'estimated yearly cost of environmental weeds to Australia — plants are the largest share',
    source: 'CSIRO / NeoBiota, 2021',
  },
  {
    value: '$300M',
    label: 'spent each year on public weed control across national parks and Indigenous lands',
    source: 'Australia State of Environment, 2021',
  },
]

const WHAT_IS_INVASIVE: TopicCard = {
  title: 'What is an environmental weed?',
  points: [
    'An environmental weed is any plant that spreads beyond where it was planted and harms native ecosystems.',
    "Most of Victoria's environmental weeds were introduced from other countries, often deliberately for garden use.",
    'Once established in the wild, they compete with, displace and sometimes completely eliminate the native plants local wildlife depends on.',
    "“Environmental weed” doesn't simply mean vigorous — a plant is ranked based on how easily it invades native vegetation, how much damage it causes, and how fast it spreads.",
    "Victoria's government assesses and ranks more than 1,800 weed species on exactly these criteria.",
    "DEECA's Weeds and Pests on Public Land program notes that many of Victoria's worst environmental weeds start out as garden plants — making every gardener's choices count.",
  ],
}

const HARM_TOPICS: TopicCard[] = [
  {
    title: 'Displacing native plants',
    points: [
      'Environmental weeds compete aggressively for light, water and nutrients.',
      'They outcompete native species that evolved over thousands of years for local conditions.',
      'High-impact weeds can dominate entire vegetation layers and cause severe biodiversity loss.',
    ],
  },
  {
    title: 'Disrupting ecological processes',
    points: [
      'Many environmental weeds alter fire regimes, water cycles and soil chemistry.',
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
      'Biodiversity 2037 names environmental weeds as a primary cause of decline in every Victorian environment.',
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

function MechCard({
  topic,
  index,
  id,
}: {
  topic: TopicCard
  index: number
  id: string
}) {
  const sub = topic.subline ?? topic.points[0]
  const body = topic.points[1] ?? ''
  const takeaway = topic.takeaway ?? topic.points[topic.points.length - 1]
  return (
    <article id={id} className="learn-mech-card">
      <div className="learn-mech-card__head">
        <span className="learn-mech-card__icon" aria-hidden>
          <LearnMechIcon kind={learnIconKindFor(topic.title)} />
        </span>
        <span className="learn-mech-card__num">
          Mechanism {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="learn-mech-card__title">{topic.title}</h3>
      <p className="learn-mech-card__sub">{sub}</p>
      {body && <p className="learn-mech-card__body">{body}</p>}
      <div className="learn-mech-card__inset">
        <p className="eyebrow">What this looks like in your garden</p>
        <p>{takeaway}</p>
      </div>
    </article>
  )
}

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

  // One reveal hook per band — same pattern as AboutPage.tsx
  const nativeHero = useScrollReveal<HTMLElement>('fade-up')
  const nativeFacts = useScrollReveal<HTMLElement>('fade-up')
  const nativeMech = useScrollReveal<HTMLElement>('rise-scale')
  const nativeCta = useScrollReveal<HTMLElement>('fade-in')
  const weedsHero = useScrollReveal<HTMLElement>('fade-up')
  const weedsFacts = useScrollReveal<HTMLElement>('slide-left')
  const weedsWhatIs = useScrollReveal<HTMLElement>('slide-right')
  const weedsMech = useScrollReveal<HTMLElement>('rise-scale')
  const weedsTiers = useScrollReveal<HTMLElement>('fade-in')
  const weedsCta = useScrollReveal<HTMLElement>('fade-in')

  return (
    <div className="learn-layout">
      <aside className="learn-sidenav" aria-label="Learn sections">
        <p className="learn-sidenav__title">On this page</p>
        <a className="learn-sidenav__link" href="#native">
          Native plants 101
        </a>
        <a className="learn-sidenav__link" href="#environmental-weeds">
          Weeds 101
        </a>
      </aside>

      <div className="learn-layout__main">
        {/* ① NATIVE HERO */}
        <section
          id="native"
          ref={nativeHero.elementRef}
          className={`learn-band learn-band--hero ${nativeHero.revealClass}`.trim()}
        >
          <div className="about-band__inner learn-hero-grid">
            <div className="learn-hero__copy">
              <p className="eyebrow">The research · Biodiversity 2037</p>
              <h1 className="learn-display">
                Why <span className="accent">native plants</span> actually matter
              </h1>
              <p className="learn-lede">
                Over half of Victoria&rsquo;s native vegetation is already gone, and
                what&rsquo;s left keeps shrinking. Your garden can change that — here&rsquo;s
                what the research shows.
              </p>
            </div>
            <ul className="learn-hero__chips" aria-label="Preview of native-plant benefits">
              {TOPICS.slice(0, 3).map((t, i) => (
                <li key={t.title}>
                  <a href={`#mech-native-${i}`} className="learn-hero-chip">
                    <span className="learn-hero-chip__icon" aria-hidden>
                      <LearnMechIcon kind={learnIconKindFor(t.title)} />
                    </span>
                    <span className="learn-hero-chip__text">
                      <strong>{t.title}</strong>
                      <small>{t.subline ?? t.points[0]}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="learn-hero__scroll-cue" aria-hidden>
              <span>Scroll</span>
              <span className="learn-hero__scroll-dot" />
            </div>
          </div>
        </section>

        {/* ② NATIVE QUICK FACTS */}
        <section
          ref={nativeFacts.elementRef}
          className={`learn-band learn-band--facts ${nativeFacts.revealClass}`.trim()}
          aria-label="Key biodiversity statistics"
        >
          <div className="about-band__inner">
            <div className="learn-band__head">
              <span className="eyebrow eyebrow--chip">Quick facts</span>
              <h2 className="learn-display learn-display--center">
                What the research shows
              </h2>
            </div>

            <ul className="learn-factrow-list">
              {STATS.map((s) => (
                <li key={s.label} className="learn-factrow learn-factrow--green">
                  <span className="learn-factrow__badge">{s.value}</span>
                  <div className="learn-factrow__body">
                    <p className="learn-factrow__title">{s.label}</p>
                    <p className="learn-factrow__source">Source: {s.source}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="learn-factrow-foot">
              Each mechanism below is backed by Victorian Government research.
            </p>
          </div>
        </section>

        {/* ③ NATIVE MECHANISMS */}
        <section
          ref={nativeMech.elementRef}
          className={`learn-band learn-band--mechanisms ${nativeMech.revealClass}`.trim()}
          aria-label="How native plants help Victoria"
        >
          <div className="about-band__inner">
            <div className="learn-band__head">
              <span className="eyebrow eyebrow--chip">The science</span>
              <h2 className="learn-display learn-display--center">
                {TOPICS.length} ways native plants help Victoria
              </h2>
              <p className="learn-lede learn-lede--center">
                These aren&rsquo;t vague wellness claims — every pathway has a measurable
                ecological return, and most start working from the day you plant.
              </p>
            </div>
            <div className="learn-mech-grid">
              {TOPICS.map((t, i) => (
                <MechCard
                  key={t.title}
                  topic={t}
                  index={i}
                  id={`mech-native-${i}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ④ NATIVE CTA */}
        <section
          ref={nativeCta.elementRef}
          className={`learn-band learn-band--cta ${nativeCta.revealClass}`.trim()}
        >
          <div className="about-band__inner learn-cta-card">
            <div className="learn-cta-card__copy">
              <h2 className="learn-display">Your garden is part of this plan</h2>
              <p>
                Biodiversity 2037 names planting native gardens as one of the most direct
                ways Victorians can protect biodiversity. Its goal: five million
                Victorians actively protecting nature by 2037 — your garden counts.
              </p>
            </div>
            <div className="learn-cta-card__actions">
              <Link to="/plants" className="btn btn-primary">
                Find native plants for my area
              </Link>
              <Link to="/map" className="btn btn-secondary">
                Find a nursery
              </Link>
            </div>
          </div>
        </section>

        {/* ⑤ WEEDS HERO */}
        <section
          id="environmental-weeds"
          ref={weedsHero.elementRef}
          className={`learn-band learn-band--hero learn-band--invasive ${weedsHero.revealClass}`.trim()}
        >
          <div className="about-band__inner learn-hero-grid">
            <div className="learn-hero__copy">
              <p className="eyebrow">Garden education · DEECA</p>
              <h1 className="learn-display">
                Why <span className="accent">environmental weeds</span> matter
              </h1>
              <p className="learn-lede">
                Many common garden plants sold across Victoria escape into bushland and
                devastate native ecosystems. Spotting them — and knowing why they cause
                harm — is one of the most impactful things a gardener can do.
              </p>
            </div>
            <ul className="learn-hero__chips" aria-label="Preview of environmental-weed harms">
              {HARM_TOPICS.slice(0, 3).map((t, i) => (
                <li key={t.title}>
                  <a href={`#mech-weeds-${i}`} className="learn-hero-chip">
                    <span className="learn-hero-chip__icon" aria-hidden>
                      <LearnMechIcon kind={learnIconKindFor(t.title)} />
                    </span>
                    <span className="learn-hero-chip__text">
                      <strong>{t.title}</strong>
                      <small>{t.subline ?? t.points[0]}</small>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="learn-hero__scroll-cue" aria-hidden>
              <span>Scroll</span>
              <span className="learn-hero__scroll-dot" />
            </div>
          </div>
        </section>

        {/* ⑥ WEEDS QUICK FACTS */}
        <section
          ref={weedsFacts.elementRef}
          className={`learn-band learn-band--facts learn-band--invasive ${weedsFacts.revealClass}`.trim()}
          aria-label="Environmental weed statistics"
        >
          <div className="about-band__inner">
            <div className="learn-band__head">
              <span className="eyebrow eyebrow--chip">Quick facts</span>
              <h2 className="learn-display learn-display--center">
                The cost of getting it wrong
              </h2>
            </div>
            <ul className="learn-factrow-list">
              {INVASIVE_STATS.map((s) => (
                <li key={s.label} className="learn-factrow learn-factrow--warning">
                  <span className="learn-factrow__badge">{s.value}</span>
                  <div className="learn-factrow__body">
                    <p className="learn-factrow__title">{s.label}</p>
                    <p className="learn-factrow__source">Source: {s.source}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ⑦ WHAT-IS-A-WEED EDITORIAL CARD */}
        <section
          ref={weedsWhatIs.elementRef}
          className={`learn-band ${weedsWhatIs.revealClass}`.trim()}
          aria-label="What is an environmental weed"
        >
          <div className="about-band__inner">
            <article className="learn-editorial-card">
              <span className="eyebrow eyebrow--chip">Plain English</span>
              <h2 className="learn-display">{WHAT_IS_INVASIVE.title}</h2>
              {WHAT_IS_INVASIVE.points.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <p className="learn-editorial-card__footer">
                <Link to="/weed#prohibited">See state prohibited weeds →</Link>
                <Link to="/weed#top-weeds">Browse top weeds in Victoria →</Link>
              </p>
            </article>
          </div>
        </section>

        {/* ⑧ WEEDS MECHANISMS */}
        <section
          ref={weedsMech.elementRef}
          className={`learn-band learn-band--mechanisms learn-band--invasive ${weedsMech.revealClass}`.trim()}
          aria-label="How environmental weeds cause harm"
        >
          <div className="about-band__inner">
            <div className="learn-band__head">
              <span className="eyebrow eyebrow--chip">The science</span>
              <h2 className="learn-display learn-display--center">
                {HARM_TOPICS.length} ways environmental weeds cause harm
              </h2>
              <p className="learn-lede learn-lede--center">
                These mechanisms compound — once they cascade through a food web, the
                damage is hard to reverse.
              </p>
            </div>
            <div className="learn-mech-grid">
              {HARM_TOPICS.map((t, i) => (
                <MechCard key={t.title} topic={t} index={i} id={`mech-weeds-${i}`} />
              ))}
            </div>
          </div>
        </section>

        {/* ⑨ TIER STRIP (demoted) */}
        <section
          ref={weedsTiers.elementRef}
          className={`learn-band learn-band--tiers ${weedsTiers.revealClass}`.trim()}
          aria-label="How Victoria classifies environmental weeds"
        >
          <div className="about-band__inner">
            <div className="learn-band__head">
              <span className="eyebrow eyebrow--chip">Legal framework</span>
              <h2 className="learn-display learn-display--center">
                How Victoria classifies environmental weeds
              </h2>
              <p className="learn-lede learn-lede--center">
                Under the Catchment and Land Protection Act 1994, weeds are placed into
                tiers based on risk and the response required of landowners.
              </p>
            </div>
            <ol className="learn-tier-strip">
              {CLASSIFICATIONS.map((c) => (
                <li key={c.tag} className={`learn-tier-strip__row learn-tier-strip__row--t${c.level}`}>
                  <span className="learn-tier-strip__level">{c.level}</span>
                  <div className="learn-tier-strip__copy">
                    <p className="learn-tier-strip__tag">{c.tag}</p>
                    <p className="learn-tier-strip__summary">{c.summary}</p>
                    <p className="learn-tier-strip__body">{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑩ WEEDS CTA */}
        <section
          ref={weedsCta.elementRef}
          className={`learn-band learn-band--cta ${weedsCta.revealClass}`.trim()}
          aria-label="What you can do in your garden"
        >
          <div className="about-band__inner learn-cta-card">
            <div className="learn-cta-card__copy">
              <h2 className="learn-display">What you can do in your garden</h2>
              <ul className="learn-topic__list">
                <li>
                  <strong>Check plants before you buy.</strong>{' '}
                  <Link to="/plants">Search any plant in PlantMe</Link> to see if it
                  appears on Victoria&rsquo;s Environmental Weeds Advisory List.
                </li>
                <li>
                  <strong>Identify what you already have.</strong>{' '}
                  <Link to="/weed#weed-checker">Snap a photo with the plant identifier</Link>{' '}
                  if you&rsquo;re unsure whether a plant is risky.
                </li>
                <li>
                  <strong>Dispose of garden waste responsibly.</strong> Never dump
                  clippings, soil or plant material in bushland —{' '}
                  <Link to="/weed#disposal">use the disposal guide</Link> for the correct
                  method by weed type.
                </li>
                <li>
                  <strong>Replace known weeds with locally appropriate native alternatives</strong>{' '}
                  — our recommendations are tuned to your suburb.
                </li>
                <li>
                  <strong>Report new or unusual infestations</strong> through the
                  Victorian Weed Spotter Network or the FeralScan app, and follow the{' '}
                  <Link to="/weed#rules">general rules</Link> when removing any weed.
                </li>
                <li>
                  <strong>Clean boots, tools and vehicle tyres</strong> after visiting
                  natural areas so you don&rsquo;t accidentally transport seeds.
                </li>
              </ul>
            </div>
            <div className="learn-cta-card__actions">
              <Link to="/weed#weed-checker" className="btn btn-primary">
                Plant identifier
              </Link>
              <Link to="/weed#disposal" className="btn btn-secondary">
                Disposal guide
              </Link>
            </div>
          </div>
        </section>

        <aside className="learn-disclaimer" role="note">
          <strong>Sources:</strong> Native-plant material on this page is summarised from{' '}
          <em>Protecting Victoria&rsquo;s Environment — Biodiversity 2037</em>, published
          by the Victorian Government (Department of Energy, Environment and Climate
          Action, formerly DELWP, 2017, CC BY 4.0). Environmental-weed material draws on
          DEECA / ARI Victoria — <em>Advisory List of Environmental Weeds in Victoria</em>{' '}
          (2022); Agriculture Victoria — <em>Invasive Plants and Animals Policy Framework</em>;
          DEECA — <em>Weeds and Pests on Public Land Program</em>; CSIRO / NeoBiota
          (2021); and the <em>Australian State of the Environment</em> (2021). For full
          detail visit{' '}
          <a
            href="https://www.environment.vic.gov.au/biodiversity/biodiversity-plan"
            target="_blank"
            rel="noopener noreferrer"
          >
            environment.vic.gov.au
          </a>
          . RootVio is not affiliated with the Victorian Government.
        </aside>
      </div>
    </div>
  )
}
