import { useLayoutEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { LearnMechIcon, learnIconKindFor } from '../components/LearnMechIcons'
import bottlebrushImg from '../assets/hero/bottlebrush.png'
import wattleImg from '../assets/hero/wattle.png'
import waratahImg from '../assets/hero/waratah.png'
import kangarooPawImg from '../assets/home/benefit-kangaroo-paw-bg.png'
import weedRotatorGorse from '../assets/home/weed-rotator-gorse.png'
import weedRotatorThistle from '../assets/home/weed-rotator-thistle.png'
import weedRotatorKhaki from '../assets/home/weed-rotator-khaki.png'

interface TopicCard {
  title: string
  /** 3+ bullet points — first becomes the lede, last becomes the takeaway. */
  points: string[]
  /** Optional one-line subline shown in primary color under the H3. */
  subline?: string
  /** Optional "What this looks like in your garden" takeaway. */
  takeaway?: string
}

interface ClassificationTier {
  level: 1 | 2 | 3 | 4
  tag: string
  summary: string
  body: string
}

interface SpeciesCard {
  name: string
  sci: string
  status: string
  note: string
  /** Accent colour used for the initial chip + tinted overlay when no image. */
  swatch: string
  /** Photographic mugshot for the card (imported asset URL). */
  image?: string
  /** Used by the bottom-row "Sold in Victorian nurseries?" chip. */
  sold?: boolean
  /** Native side flips the chip to a positive tone. */
  positive?: boolean
}

const NATIVE_STAT_STRIP: { value: string; caption: string }[] = [
  { value: '5,000+', caption: 'Victorian native plant species recorded statewide' },
  { value: '6 EVCs', caption: 'curated for typical home-garden bioregions' },
  { value: 'Vic', caption: 'recommendations matched to your bioregion' },
]

const WEED_STAT_STRIP: { value: string; caption: string }[] = [
  { value: '1 in 3', caption: "of Australia's worst weeds began as garden plants" },
  { value: '~70%', caption: 'of Victorian environmental weeds were deliberately introduced' },
  { value: 'Vic', caption: 'guidance current as of the 2022 advisory list' },
]

const NATIVE_SPECIES: SpeciesCard[] = [
  {
    name: 'Bottlebrush',
    sci: 'Callistemon citrinus',
    status: 'pollinator magnet',
    note: 'Brilliant red brushes draw honeyeaters and native bees from spring into summer.',
    swatch: '#B0394A',
    image: bottlebrushImg,
    positive: true,
  },
  {
    name: 'Golden Wattle',
    sci: 'Acacia pycnantha',
    status: 'pollinator host',
    note: "Hosts butterfly larvae and fixes nitrogen — Australia's floral emblem.",
    swatch: '#C99A2E',
    image: wattleImg,
    positive: true,
  },
  {
    name: 'Waratah',
    sci: 'Telopea oreades',
    status: 'understory icon',
    note: 'Bold red blooms feed honeyeaters; a striking presence in a part-shaded native bed.',
    swatch: '#B22B2B',
    image: waratahImg,
    positive: true,
  },
  {
    name: 'Kangaroo Paw',
    sci: 'Anigozanthos manglesii',
    status: 'long-flowering nectar',
    note: 'Tubular flowers feed birds for months; tolerant of summer heat and dry spells.',
    swatch: '#5D8A4D',
    image: kangarooPawImg,
    positive: true,
  },
]

const WEED_SPECIES: SpeciesCard[] = [
  {
    name: 'Gorse',
    sci: 'Ulex europaeus',
    sold: true,
    status: 'state prohibited weed',
    note: 'Once widely planted for hedges; now smothers grasslands and fuels intense fires.',
    swatch: '#C99A2E',
    image: weedRotatorGorse,
  },
  {
    name: 'Scotch Thistle',
    sci: 'Cirsium vulgare',
    sold: true,
    status: 'regionally controlled weed',
    note: 'Wind-blown seed escapes a single garden by kilometres into bushland and pasture.',
    swatch: '#6E3552',
    image: weedRotatorThistle,
  },
  {
    name: 'Khaki Weed',
    sci: 'Alternanthera pungens',
    sold: false,
    status: 'environmental weed',
    note: 'Low spiny mats invade lawns, parks and waterways once carried in on soil or tyres.',
    swatch: '#8C4516',
    image: weedRotatorKhaki,
  },
]

const TOPICS: TopicCard[] = [
  {
    title: 'Life-sustaining ecosystem services',
    points: [
      "Victoria's plants, animals, soils and waterways work together as one system.",
      'They produce clean air and water, productive soils, and natural pest control — for free.',
      'They also drive pollination, flood mitigation and carbon sequestration.',
      'Replacing these services with built infrastructure would be “extremely costly, if not impossible.”',
    ],
    subline:
      "Victoria's plants, animals, soils and waterways work together as one system — and your garden plugs straight in.",
    takeaway:
      'A native shrub layer in one yard already feeds the same insects your fruit tree needs to set fruit.',
  },
  {
    title: 'Physical and mental health',
    points: [
      'Contact with nature speeds recovery from surgery and lowers blood pressure.',
      'It is linked to fewer medications and a stronger immune system.',
      'For children, time in nature builds mental health, resilience and social connections.',
      'Rising urbanisation means fewer people access nature, leading to poorer health outcomes.',
    ],
    subline:
      'Even a small native garden lets the people who live with it spend more time around plants — measurably good for them.',
    takeaway:
      'A morning under the canopy lowers cortisol; a balcony of pollinator plants does much of the same job.',
  },
  {
    title: 'Cooling cities and fighting climate change',
    points: [
      'Native vegetation sequesters carbon over its lifetime.',
      'Shade from trees and shrubs cools streets and homes.',
      'Cooler cities use less energy for air conditioning.',
      'Urban forests of native species reduce the heat-island effect — and cost less than built alternatives.',
    ],
    subline: 'Shade from native canopy is the cheapest cooling Melbourne has — and it gets better every year.',
    takeaway:
      'A single mature eucalypt cools its plot by several degrees on a 40 °C day, year after year, for free.',
  },
  {
    title: 'Flood and weather resilience',
    points: [
      'Native vegetation soaks up and slows run-off after heavy rain.',
      'This lessens flooding and the damage that follows.',
      "Victoria's parks save an estimated $46 million per year in avoided flood infrastructure costs.",
      'They also deliver $33–50 million per year in water-purification benefits.',
    ],
    subline: "Roots and litter slow stormwater before it ever reaches a drain — the cheapest flood management we have.",
    takeaway:
      'A garden bed of tussock-grass and groundcover absorbs more storm-runoff than the lawn it replaces.',
  },
  {
    title: 'Liveable, resilient communities',
    points: [
      'Parks, gardens, street trees and backyards form a connected green network.',
      'These spaces lift liveability and help communities cope with climate change.',
      'Native plants improve air quality and filter stormwater locally.',
      'They reconnect people with nature right where they live.',
    ],
    subline:
      "Backyards, street trees and parks together make the green network that holds a suburb's biodiversity.",
    takeaway:
      'Even a single front-yard hedge of correas connects two parks for the small birds that move between them.',
  },
  {
    title: 'Economic value of natural capital',
    points: [
      "Rebuilding Victoria's natural capital could deliver $15–36 billion in benefits.",
      'Letting it decline further could cost $16–78 billion.',
      'Agriculture, forestry and fisheries depend directly on healthy ecosystems.',
      'Together they contribute around $8 billion to the state economy each year.',
    ],
    subline:
      "The state's natural capital is worth tens of billions — and your garden is one of the cheapest ways to invest in it.",
    takeaway:
      'A native garden adds measurable resale value and lowers running costs for water, cooling, and pest control.',
  },
]

const WHAT_IS_INVASIVE: TopicCard = {
  title: 'What is an environmental weed?',
  points: [
    'An environmental weed is any plant that spreads beyond where it was planted and harms native ecosystems.',
    "Most of Victoria's environmental weeds were introduced from other countries, often deliberately for garden use.",
    'Once established in the wild, they compete with, displace and sometimes completely eliminate the native plants local wildlife depends on.',
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
    subline: 'Weeds outcompete plants that evolved over thousands of years for local conditions.',
    takeaway:
      'An English ivy mat in one corner can blanket an understory in three seasons, smothering ground orchids and fern fronds.',
  },
  {
    title: 'Disrupting ecological processes',
    points: [
      'Many environmental weeds alter fire regimes, water cycles and soil chemistry.',
      'Some changes are so extensive that native ecosystems cannot recover.',
      'Others introduce diseases or alter the soil microbiome that natives rely on.',
    ],
    subline: 'Weeds rewrite the systems an ecosystem runs on — fire, water, soil.',
    takeaway:
      'Pampas grass increases fuel loads and changes how fire moves through grassland — burning hotter and reducing seedbank survival.',
  },
  {
    title: 'Collapsing food webs',
    points: [
      'Native birds, insects, bats and lizards depend on specific native plants for food and shelter.',
      'When weeds replace those natives, the food web that depends on them collapses.',
      'The damage cascades from soil microbes all the way to apex predators.',
    ],
    subline: 'Native birds, insects, bats and lizards depend on specific native plants for food and shelter.',
    takeaway:
      "Without local wattles and eucalypts in flower, sugar gliders lose winter nectar — even if the garden looks 'green'.",
  },
  {
    title: 'Spreading further than you’d think',
    points: [
      'Seeds spread by wind, water, birds and on clothing or vehicle tyres.',
      'A single garden can seed kilometres of bushland downstream or downwind.',
      'Biodiversity 2037 names environmental weeds as a primary cause of decline in every Victorian environment.',
    ],
    subline: "Wind, water, birds and garden waste move seeds kilometres from where they started.",
    takeaway:
      'Cotoneaster berries from a suburban hedge end up in a national-park gully via a single magpie — kilometres from any planted shrub.',
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

/** Per-mechanism palette — keys feed the active-stepper accent CSS vars. */
const MECH_TONES_NATIVE = [
  { accent: '#1F5A33', bg: '#E3ECCD' },
  { accent: '#9A3A2E', bg: '#F4E1D6' },
  { accent: '#B8601C', bg: '#F6E4CC' },
  { accent: '#3672A8', bg: '#DDE6F0' },
  { accent: '#6F8E35', bg: '#E8EED7' },
  { accent: '#6F4A1F', bg: '#EFE1C7' },
] as const

const MECH_TONES_WEEDS = [
  { accent: '#9A3A2E', bg: '#F4E1D6' },
  { accent: '#B8601C', bg: '#F6E4CC' },
  { accent: '#6E3552', bg: '#ECDDE3' },
  { accent: '#6F4A1F', bg: '#EFE1C7' },
] as const

/** Interactive species reveal card — used in both hero columns. */
function SpeciesRevealCard({
  species,
  tone,
  positive,
  label,
}: {
  species: SpeciesCard[]
  tone: 'native' | 'weed'
  positive: boolean
  /** "Common garden plant" or "Native showcase" — top-left mono label. */
  label: string
}) {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const sp = species[idx]

  const cycle = () => {
    setRevealed(false)
    setTimeout(() => setIdx((i) => (i + 1) % species.length), 180)
  }

  const statusChipClass = positive
    ? 'learn-vcard__chip learn-vcard__chip--status learn-vcard__chip--benefit'
    : 'learn-vcard__chip learn-vcard__chip--status learn-vcard__chip--harm'

  return (
    <div className="learn-vcard" data-tone={tone}>
      <div className="learn-vcard__head">
        <span className="learn-mono">
          {label} · {String(idx + 1).padStart(2, '0')}/{String(species.length).padStart(2, '0')}
        </span>
        <button type="button" className="learn-vcard__next" onClick={cycle}>
          Next →
        </button>
      </div>

      <div
        className={`learn-vcard__mug${sp.image ? ' learn-vcard__mug--photo' : ''}`}
        style={
          sp.image
            ? undefined
            : {
                background: `repeating-linear-gradient(135deg, ${sp.swatch}22 0 14px, ${sp.swatch}11 14px 28px), linear-gradient(180deg, ${sp.swatch}55, ${sp.swatch}22)`,
              }
        }
      >
        {sp.image && (
          <img
            className="learn-vcard__mug-img"
            src={sp.image}
            alt={`${sp.name} (${sp.sci})`}
            loading="lazy"
          />
        )}
        <div className="learn-vcard__initial" style={{ color: sp.swatch }}>
          {sp.name.charAt(0)}
        </div>
      </div>

      <p className="learn-vcard__name">{sp.name}</p>
      <p className="learn-vcard__sci">{sp.sci}</p>

      <div className="learn-vcard__rows">
        <div className="learn-vcard__row">
          <span className="learn-vcard__row-label">
            {tone === 'weed'
              ? 'Sold in Victorian nurseries?'
              : 'Listed for Victorian gardens?'}
          </span>
          <span
            className={
              positive
                ? 'learn-vcard__chip learn-vcard__chip--good'
                : 'learn-vcard__chip learn-vcard__chip--yes'
            }
          >
            {positive ? 'YES — RECOMMENDED' : 'YES'}
          </span>
        </div>
        <div className="learn-vcard__row">
          <span className="learn-vcard__row-label">
            {tone === 'weed' ? 'Status in the wild' : "What it offers wildlife"}
          </span>
          {!revealed ? (
            <button
              type="button"
              className="learn-vcard__chip--reveal"
              onClick={() => setRevealed(true)}
            >
              Reveal
            </button>
          ) : (
            <span className={statusChipClass}>{sp.status}</span>
          )}
        </div>
        {revealed && <p className="learn-vcard__note">{sp.note}</p>}
      </div>
    </div>
  )
}

/** Interactive mechanism stepper + featured card. */
function MechanismStepper({
  topics,
  tones,
  idPrefix,
}: {
  topics: TopicCard[]
  tones: readonly { accent: string; bg: string }[]
  idPrefix: string
}) {
  const [active, setActive] = useState(0)
  const m = topics[active]
  const tone = tones[active % tones.length]

  return (
    <>
      <div
        className={`learn-stepper learn-stepper--${topics.length}`}
        role="tablist"
        aria-label="Mechanisms"
      >
        {topics.map((t, i) => {
          const isActive = i === active
          const t_tone = tones[i % tones.length]
          return (
            <button
              key={t.title}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`learn-stepper__tab${isActive ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
              style={
                {
                  '--learn-tab-bg': isActive ? t_tone.bg : 'transparent',
                  '--learn-tab-accent': t_tone.accent,
                } as React.CSSProperties
              }
            >
              <div className="learn-stepper__tab-head">
                <span className="learn-stepper__tab-num">
                  Mech · {String(i + 1).padStart(2, '0')}
                </span>
                <span className="learn-stepper__tab-icon" style={{ color: t_tone.accent }}>
                  <LearnMechIcon kind={learnIconKindFor(t.title)} />
                </span>
              </div>
              <span className="learn-stepper__tab-title">{t.title}</span>
            </button>
          )
        })}
      </div>

      <article
        id={`${idPrefix}-${active}`}
        className="learn-feature"
        style={
          {
            '--learn-tab-bg': tone.bg,
            '--learn-tab-accent': tone.accent,
          } as React.CSSProperties
        }
      >
        <div>
          <span className="learn-feature__chip">
            <span style={{ color: tone.accent }}>
              <LearnMechIcon kind={learnIconKindFor(m.title)} />
            </span>
            Mechanism {String(active + 1).padStart(2, '0')}
          </span>
          <h3 className="learn-display learn-feature__title">{m.title}</h3>
          <p className="learn-feature__lede">{m.subline ?? m.points[0]}</p>
          <p className="learn-feature__body">{m.points[1] ?? m.points[0]}</p>
        </div>
        <div className="learn-feature__garden">
          <span className="learn-feature__garden-tag">
            What this looks like in your garden
          </span>
          <p className="learn-feature__garden-q">
            {m.takeaway ?? m.points[m.points.length - 1]}
          </p>
        </div>
      </article>

      <div className="learn-cascade" aria-label="Mechanism cascade">
        <div>
          <p className="learn-cascade__lab">The cascade</p>
          <p className="learn-cascade__head">
            How effects <em>compound</em>
          </p>
        </div>
        <div className="learn-cascade__row">
          {topics.map((t, i) => {
            const isActive = i === active
            const t_tone = tones[i % tones.length]
            return (
              <span key={t.title} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  className={`learn-cascade__pill${isActive ? ' is-active' : ''}`}
                  onClick={() => setActive(i)}
                  style={{
                    background: isActive ? t_tone.accent : 'rgba(255, 255, 255, 0.7)',
                    color: isActive ? '#fff' : t_tone.accent,
                    borderColor: `${t_tone.accent}55`,
                  }}
                >
                  <span className="learn-cascade__pill-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {t.title.split(' ').slice(0, 2).join(' ')}
                </button>
                {i < topics.length - 1 && (
                  <svg
                    className="learn-cascade__arrow"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 7h8M7 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </>
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

  // One reveal hook per band — pattern from AboutPage.tsx
  const nativeHero = useScrollReveal<HTMLElement>('fade-up')
  const nativeFacts = useScrollReveal<HTMLElement>('fade-up')
  const nativeMech = useScrollReveal<HTMLElement>('rise-scale')
  const nativeCta = useScrollReveal<HTMLElement>('fade-in')
  const weedsHero = useScrollReveal<HTMLElement>('fade-up')
  const weedsFacts = useScrollReveal<HTMLElement>('slide-left')
  const weedsDef = useScrollReveal<HTMLElement>('slide-right')
  const weedsMech = useScrollReveal<HTMLElement>('rise-scale')
  const weedsTiers = useScrollReveal<HTMLElement>('fade-in')
  const weedsCta = useScrollReveal<HTMLElement>('fade-in')

  return (
    <div className="learn-layout">
      <div className="learn-layout__main">
        {/* ① NATIVE HERO */}
        <section
          id="native"
          ref={nativeHero.elementRef}
          className={`learn-band learn-band--hero ${nativeHero.revealClass}`.trim()}
        >
          <div className="learn-band__inner">
            <div className="learn-hero-grid">
              <div>
                <div className="learn-hero__brand">
                  <span className="learn-hero__brand-mark">n</span>
                  <span className="learn-hero__brand-text">
                    Garden education
                    <span className="sep">·</span>
                    Biodiversity 2037
                  </span>
                </div>

                <h1 className="learn-display learn-hero__headline">
                  Why
                  <br />
                  <span className="accent">native plants</span>
                  <br />
                  <span className="italic">actually</span> matter
                </h1>

                <p className="learn-hero__lede">
                  Over half of Victoria&rsquo;s native vegetation is already gone, and
                  what&rsquo;s left keeps shrinking. Your garden can change that —
                  here&rsquo;s what the research shows.
                </p>

                <div className="learn-hero__cta">
                  <a className="learn-btn" href="#mech-native">
                    Start learning
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M3 7h8M7 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                  <Link to="/plants" className="learn-btn learn-btn--ghost">
                    Find native plants
                  </Link>
                </div>

                <div className="learn-hero__stat-strip">
                  {NATIVE_STAT_STRIP.map((s) => (
                    <div key={s.value}>
                      <div className="learn-hero__stat-num">{s.value}</div>
                      <div className="learn-hero__stat-cap">{s.caption}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="learn-hero__visual">
                <SpeciesRevealCard
                  species={NATIVE_SPECIES}
                  tone="native"
                  positive
                  label="Native showcase"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ② NATIVE QUICK FACTS */}
        <section
          ref={nativeFacts.elementRef}
          className={`learn-band learn-band--facts ${nativeFacts.revealClass}`.trim()}
          aria-label="Native biodiversity statistics"
        >
          <div className="learn-band__inner">
            <div className="learn-band__head">
              <span className="learn-eyebrow">
                <span className="learn-eyebrow__dot" />
                Quick facts
              </span>
              <span className="learn-band__head-rule" />
              <span className="learn-mono">03 figures</span>
            </div>
            <h2 className="learn-h2">
              What the <span className="italic accent-green">research shows</span>
            </h2>

            <div className="learn-hero-stat" style={{ marginTop: 'clamp(2rem, 4vw, 3.5rem)' }}>
              <div>
                <div className="learn-hero-stat__big-tag">The headline figure</div>
                <div className="learn-hero-stat__big">&gt;50%</div>
                <p className="learn-hero-stat__copy">
                  Of Victoria&rsquo;s native vegetation has been{' '}
                  <b>cleared since European settlement</b>. What&rsquo;s left keeps shrinking by
                  thousands of hectares every year.
                </p>
                <div className="learn-hero-stat__src">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Source: Biodiversity 2037, Ch. 1 (Victorian Government, 2017)
                </div>
              </div>
              <div className="learn-compare">
                <p className="learn-compare__title">How the loss compares</p>
                {[
                  { label: 'Native vegetation cleared', pct: 100, val: '>50%', color: '#8C4516' },
                  { label: 'Annual habitat loss', pct: 34, val: '4,000 ha / yr', color: '#6F4A1F' },
                  { label: 'Urban heat health cost', pct: 12, val: '$283M / yr', color: '#1F5A33' },
                ].map((row) => (
                  <div key={row.label} className="learn-compare__row">
                    <div className="learn-compare__row-head">
                      <span className="learn-compare__row-label">{row.label}</span>
                      <span
                        className="learn-compare__row-value"
                        style={{ color: row.color }}
                      >
                        {row.val}
                      </span>
                    </div>
                    <div className="learn-compare__bar">
                      <div
                        className="learn-compare__bar-fill"
                        style={{ width: `${row.pct}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
                <p className="learn-compare__foot">
                  Bars normalised to the headline figure. The damage compounds — every hectare lost
                  also raises long-term urban heat costs.
                </p>
              </div>
            </div>

            <div className="learn-supporting">
              {[
                {
                  big: '4,000',
                  label: 'habitat hectares lost yearly',
                  detail: 'even with current regulations in place — Victoria-wide.',
                  src: 'Biodiversity 2037, Ch. 2',
                },
                {
                  big: '$283M',
                  label: "Melbourne's urban heat cost",
                  detail: 'annual health and productivity burden of the heat-island effect.',
                  src: 'Biodiversity 2037, Ch. 5',
                },
                {
                  big: '$46M',
                  label: 'parks save in flood costs',
                  detail: 'per year, by absorbing storm-runoff before it reaches drains.',
                  src: 'Biodiversity 2037, Ch. 4',
                },
              ].map((s) => (
                <div key={s.big} className="learn-supporting__cell">
                  <div className="learn-supporting__big">{s.big}</div>
                  <div className="learn-supporting__label">{s.label}</div>
                  <div className="learn-supporting__detail">{s.detail}</div>
                  <div className="learn-supporting__src">{s.src}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ③ NATIVE MECHANISMS */}
        <section
          id="mech-native"
          ref={nativeMech.elementRef}
          className={`learn-band learn-band--mechanisms ${nativeMech.revealClass}`.trim()}
          aria-label="How native plants help Victoria"
        >
          <div className="learn-band__inner">
            <div className="learn-mech__head">
              <div className="learn-mech__eyebrow-wrap">
                <span className="learn-eyebrow">
                  <span className="learn-eyebrow__dot" />
                  The science
                </span>
              </div>
              <h2 className="learn-h2 learn-mech__title">
                Six ways native plants <span className="italic accent-green">help Victoria</span>
              </h2>
              <p className="learn-mech__intro">
                Each mechanism has a measurable ecological return — and most start working from the
                day you plant. Click a tile to expand it.
              </p>
            </div>

            <MechanismStepper topics={TOPICS} tones={MECH_TONES_NATIVE} idPrefix="mech-native" />
          </div>
        </section>

        {/* ④ NATIVE CTA */}
        <section
          ref={nativeCta.elementRef}
          className={`learn-band learn-band--cta ${nativeCta.revealClass}`.trim()}
        >
          <div className="learn-band__inner">
            <div className="learn-cta-card">
              <div className="learn-cta-card__copy">
                <h2 className="learn-display">Your garden is part of this plan</h2>
                <p>
                  Biodiversity 2037 names planting native gardens as one of the most direct ways
                  Victorians can protect biodiversity. Its goal: five million Victorians actively
                  protecting nature by 2037 — your garden counts.
                </p>
              </div>
              <div className="learn-cta-card__actions">
                <Link to="/plants" className="learn-btn">
                  Find native plants for my area
                </Link>
                <Link to="/map" className="learn-btn learn-btn--ghost">
                  Find a nursery
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ⑤ WEEDS HERO */}
        <section
          id="environmental-weeds"
          ref={weedsHero.elementRef}
          className={`learn-band learn-band--hero learn-band--invasive ${weedsHero.revealClass}`.trim()}
        >
          <div className="learn-band__inner">
            <div className="learn-hero-grid">
              <div>
                <div className="learn-hero__brand">
                  <span className="learn-hero__brand-mark">w</span>
                  <span className="learn-hero__brand-text">
                    Garden education
                    <span className="sep">·</span>
                    DEECA
                  </span>
                </div>

                <h1 className="learn-display learn-hero__headline">
                  Why
                  <br />
                  <span className="accent">environmental</span>
                  <br />
                  <span className="italic">weeds</span> matter
                </h1>

                <p className="learn-hero__lede">
                  Many common garden plants sold across Victoria escape into bushland and devastate
                  native ecosystems. Spotting them — and knowing why they cause harm — is one of the
                  most impactful things a gardener can do.
                </p>

                <div className="learn-hero__cta">
                  <a className="learn-btn" href="#mech-weeds">
                    Start learning
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path
                        d="M3 7h8M7 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                  <Link to="/weed" className="learn-btn learn-btn--ghost">
                    Browse 1,800+ weeds
                  </Link>
                </div>

                <div className="learn-hero__stat-strip">
                  {WEED_STAT_STRIP.map((s) => (
                    <div key={s.value}>
                      <div className="learn-hero__stat-num">{s.value}</div>
                      <div className="learn-hero__stat-cap">{s.caption}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="learn-hero__visual">
                <SpeciesRevealCard
                  species={WEED_SPECIES}
                  tone="weed"
                  positive={false}
                  label="Common garden plant"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ⑥ WEEDS QUICK FACTS */}
        <section
          ref={weedsFacts.elementRef}
          className={`learn-band learn-band--facts learn-band--invasive ${weedsFacts.revealClass}`.trim()}
          aria-label="Environmental weed statistics"
        >
          <div className="learn-band__inner">
            <div className="learn-band__head">
              <span className="learn-eyebrow">
                <span className="learn-eyebrow__dot" />
                Quick facts
              </span>
              <span className="learn-band__head-rule" />
              <span className="learn-mono">03 figures</span>
            </div>
            <h2 className="learn-h2">
              The cost of <span className="italic accent-terra">getting it wrong</span>
            </h2>

            <div className="learn-hero-stat" style={{ marginTop: 'clamp(2rem, 4vw, 3.5rem)' }}>
              <div>
                <div className="learn-hero-stat__big-tag">The headline figure</div>
                <div className="learn-hero-stat__big">
                  $24.5<span className="learn-hero-stat__big-sup">b</span>
                </div>
                <p className="learn-hero-stat__copy">
                  Estimated <b>yearly</b> cost of invasive species to Australia. Plants are the{' '}
                  <b>single largest share</b>.
                </p>
                <div className="learn-hero-stat__src">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Source: CSIRO / NeoBiota, 2021
                </div>
              </div>
              <div className="learn-compare">
                <p className="learn-compare__title">How $24.5B compares</p>
                {[
                  { label: 'Invasive plants', pct: 100, val: '$24.5B', color: '#8C4516' },
                  { label: 'All other invasive species combined', pct: 55, val: '~$13.5B', color: '#6F4A1F' },
                  { label: 'Public-land weed control', pct: 1.2, val: '$300M', color: '#1F5A33' },
                ].map((row) => (
                  <div key={row.label} className="learn-compare__row">
                    <div className="learn-compare__row-head">
                      <span className="learn-compare__row-label">{row.label}</span>
                      <span className="learn-compare__row-value" style={{ color: row.color }}>
                        {row.val}
                      </span>
                    </div>
                    <div className="learn-compare__bar">
                      <div
                        className="learn-compare__bar-fill"
                        style={{ width: `${row.pct}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
                <p className="learn-compare__foot">
                  Bars normalised to the headline figure. Spending on control is a small fraction
                  of the harm.
                </p>
              </div>
            </div>

            <div className="learn-supporting">
              {[
                {
                  big: '1,800+',
                  label: 'environmental weed species',
                  detail: "listed in Victoria's 2022 advisory list.",
                  src: 'DEECA / ARI Victoria',
                },
                {
                  big: '$300M',
                  label: 'spent yearly on control',
                  detail: 'across national parks and Indigenous lands.',
                  src: 'Australia State of Environment, 2021',
                },
                {
                  big: '~70%',
                  label: 'of weeds were deliberately introduced',
                  detail: 'mostly as garden ornamentals from overseas.',
                  src: 'ARI Victoria',
                },
              ].map((s) => (
                <div key={s.big} className="learn-supporting__cell">
                  <div className="learn-supporting__big">{s.big}</div>
                  <div className="learn-supporting__label">{s.label}</div>
                  <div className="learn-supporting__detail">{s.detail}</div>
                  <div className="learn-supporting__src">{s.src}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑦ WEEDS DEFINITION */}
        <section
          ref={weedsDef.elementRef}
          className={`learn-band learn-band--definition learn-band--invasive ${weedsDef.revealClass}`.trim()}
          aria-label="What is an environmental weed"
        >
          <div className="learn-band__inner">
            <div className="learn-band__head" style={{ marginBottom: '1rem' }}>
              <span className="learn-eyebrow">
                <span className="learn-eyebrow__dot" />
                Plain English
              </span>
            </div>

            <div className="learn-definition">
              <div>
                <h2 className="learn-h2">
                  What is an <span className="italic accent-terra">environmental weed?</span>
                </h2>
                <p className="learn-definition__lede" style={{ marginTop: '1.5rem' }}>
                  Any plant that{' '}
                  <mark>spreads beyond where it was planted</mark> and harms native ecosystems.
                </p>
                <p className="learn-definition__p">{WHAT_IS_INVASIVE.points[1]}</p>
                <p className="learn-definition__p">{WHAT_IS_INVASIVE.points[2]}</p>

                <div className="learn-ranking">
                  <p className="learn-ranking__tag">How weeds are ranked</p>
                  <p className="learn-ranking__head">
                    Vigour alone isn&rsquo;t enough. Victoria&rsquo;s government scores every plant on
                    three things:
                  </p>
                  <div className="learn-ranking__grid">
                    {[
                      {
                        l: 'I',
                        name: 'Invasiveness',
                        desc: 'How easily a plant escapes gardens and establishes in native vegetation.',
                      },
                      {
                        l: 'D',
                        name: 'Damage',
                        desc: 'How severely it harms ecological structure, function and biodiversity.',
                      },
                      {
                        l: 'S',
                        name: 'Spread',
                        desc: 'How fast it expands its range — by seed, runner, root or animal vector.',
                      },
                    ].map((c) => (
                      <div key={c.l} className="learn-ranking__card">
                        <div className="learn-ranking__letter">{c.l}</div>
                        <div className="learn-ranking__name">{c.name}</div>
                        <div className="learn-ranking__desc">{c.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <blockquote className="learn-quote">
                  “Many of Victoria&rsquo;s worst environmental weeds start out as{' '}
                  <span className="learn-quote__highlight">garden plants</span> — making every
                  gardener&rsquo;s choices count.”
                  <span className="learn-quote__footer">
                    — DEECA, <em>Weeds &amp; Pests on Public Land</em>
                  </span>
                </blockquote>

                <div className="learn-definition__links">
                  <Link to="/weed#prohibited" className="learn-definition__link">
                    See state prohibited weeds <span aria-hidden>→</span>
                  </Link>
                  <Link to="/weed#top-weeds" className="learn-definition__link">
                    Browse top weeds in Victoria <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>

              <aside className="learn-aside">
                <div className="learn-aside__dark">
                  <p className="learn-aside__dark-tag">Did you know</p>
                  <p className="learn-aside__dark-q">
                    A single agapanthus head can release <em>~600 seeds</em>.
                  </p>
                  <p className="learn-aside__dark-body">
                    Each one is a future bushland incursion — wind and water carry them well beyond
                    the fence line.
                  </p>
                </div>

                {[
                  {
                    label: 'Where assessments apply',
                    value: 'Victoria-wide, with regional risk overlays',
                  },
                  { label: 'Last advisory update', value: '2022 (DEECA / ARI)' },
                  {
                    label: 'Legal status',
                    value: 'Some weeds are State Prohibited; sale and propagation are offences',
                  },
                  {
                    label: 'Your role',
                    value: 'Choosing native or non-invasive substitutes is the highest-leverage action',
                  },
                ].map((f) => (
                  <div key={f.label} className="learn-fact">
                    <div className="learn-fact__check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2.5 6.5l2.5 2.5 4.5-5"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="learn-fact__label">{f.label}</p>
                      <p className="learn-fact__value">{f.value}</p>
                    </div>
                  </div>
                ))}
              </aside>
            </div>
          </div>
        </section>

        {/* ⑧ WEEDS MECHANISMS */}
        <section
          id="mech-weeds"
          ref={weedsMech.elementRef}
          className={`learn-band learn-band--mechanisms learn-band--invasive ${weedsMech.revealClass}`.trim()}
          aria-label="How environmental weeds cause harm"
        >
          <div className="learn-band__inner">
            <div className="learn-mech__head">
              <div className="learn-mech__eyebrow-wrap">
                <span className="learn-eyebrow">
                  <span className="learn-eyebrow__dot" />
                  The science
                </span>
              </div>
              <h2 className="learn-h2 learn-mech__title">
                Four ways environmental weeds <span className="italic accent-terra">cause harm</span>
              </h2>
              <p className="learn-mech__intro">
                These mechanisms compound. Once the cascade reaches the food web, the damage is
                hard — sometimes impossible — to reverse.
              </p>
            </div>

            <MechanismStepper
              topics={HARM_TOPICS}
              tones={MECH_TONES_WEEDS}
              idPrefix="mech-weeds"
            />
          </div>
        </section>

        {/* ⑨ TIER STRIP */}
        <section
          ref={weedsTiers.elementRef}
          className={`learn-band learn-band--tiers learn-band--invasive ${weedsTiers.revealClass}`.trim()}
          aria-label="How Victoria classifies environmental weeds"
        >
          <div className="learn-band__inner">
            <div className="learn-mech__head">
              <div className="learn-mech__eyebrow-wrap">
                <span className="learn-eyebrow">
                  <span className="learn-eyebrow__dot" />
                  Legal framework
                </span>
              </div>
              <h2 className="learn-h2 learn-mech__title">
                How Victoria <span className="italic accent-terra">classifies</span> environmental weeds
              </h2>
              <p className="learn-mech__intro">
                Under the Catchment and Land Protection Act 1994, weeds are placed into tiers based
                on risk and the response required of landowners.
              </p>
            </div>
            <ol className="learn-tiers-strip">
              {CLASSIFICATIONS.map((c) => (
                <li
                  key={c.tag}
                  className={`learn-tiers-strip__row learn-tiers-strip__row--t${c.level}`}
                >
                  <span className="learn-tiers-strip__level">{c.level}</span>
                  <div>
                    <p className="learn-tiers-strip__tag">{c.tag}</p>
                    <p className="learn-tiers-strip__summary">{c.summary}</p>
                    <p className="learn-tiers-strip__body">{c.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑩ WEEDS CTA */}
        <section
          ref={weedsCta.elementRef}
          className={`learn-band learn-band--cta learn-band--invasive ${weedsCta.revealClass}`.trim()}
          aria-label="What you can do in your garden"
        >
          <div className="learn-band__inner">
            <div className="learn-cta-card">
              <div className="learn-cta-card__copy">
                <h2 className="learn-display">What you can do in your garden</h2>
                <ul>
                  <li>
                    <strong>Check plants before you buy.</strong>{' '}
                    <Link to="/plants">Search any plant in PlantMe</Link> to see if it appears on
                    Victoria&rsquo;s Environmental Weeds Advisory List.
                  </li>
                  <li>
                    <strong>Identify what you already have.</strong>{' '}
                    <Link to="/weed#weed-checker">Snap a photo with the plant identifier</Link> if
                    you&rsquo;re unsure whether a plant is risky.
                  </li>
                  <li>
                    <strong>Dispose of garden waste responsibly.</strong> Never dump clippings,
                    soil or plant material in bushland —{' '}
                    <Link to="/weed#disposal">use the disposal guide</Link>.
                  </li>
                  <li>
                    <strong>Replace known weeds with native alternatives</strong> tuned to your
                    suburb&rsquo;s bioregion.
                  </li>
                </ul>
              </div>
              <div className="learn-cta-card__actions">
                <Link to="/weed#weed-checker" className="learn-btn">
                  Plant identifier
                </Link>
                <Link to="/weed#disposal" className="learn-btn learn-btn--ghost">
                  Disposal guide
                </Link>
              </div>
            </div>
            <aside className="learn-disclaimer" role="note">
              <strong>Sources:</strong> Native-plant material on this page is summarised from{' '}
              <em>Protecting Victoria&rsquo;s Environment — Biodiversity 2037</em> (Victorian
              Government / DEECA, 2017, CC BY 4.0). Environmental-weed material draws on DEECA /
              ARI Victoria, the <em>Advisory List of Environmental Weeds in Victoria</em> (2022),
              Agriculture Victoria, CSIRO / NeoBiota (2021), and the{' '}
              <em>Australian State of the Environment</em> (2021). For full detail visit{' '}
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
        </section>
      </div>
    </div>
  )
}
