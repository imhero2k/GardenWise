import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import waratahImg from '../assets/hero/waratah.png'
import wattleImg from '../assets/hero/wattle.png'
import bottlebrushImg from '../assets/hero/bottlebrush.png'
import logoImg from '../assets/logo.png'
import benefitPollinatorsBg from '../assets/home/benefit-pollinators-bg.png'
import benefitKangarooPawBg from '../assets/home/benefit-kangaroo-paw-bg.png'
import benefitNaturalEconomyBg from '../assets/home/benefit-natural-economy-bg.png'
import benefitWellbeingBg from '../assets/home/benefit-wellbeing-bg.png'
import weedRotatorKhaki from '../assets/home/weed-rotator-khaki.png'
import weedRotatorThistle from '../assets/home/weed-rotator-thistle.png'
import weedRotatorGorse from '../assets/home/weed-rotator-gorse.png'

const WEED_EXAMPLE_SLIDES: { src: string; alt: string }[] = [
  {
    src: weedRotatorKhaki,
    alt: 'Low-growing invasive weed with spiky white flower clusters among grass.',
  },
  {
    src: weedRotatorThistle,
    alt: 'Spiny thistle with a purple flower and a bumblebee, against the sky.',
  },
  {
    src: weedRotatorGorse,
    alt: 'Flowering gorse with bright yellow pea blossoms and sharp green spines.',
  },
]

const HERO_SLIDES: { src: string; alt: string }[] = [
  { src: waratahImg, alt: 'Waratah in bloom against native bushland' },
  { src: wattleImg, alt: 'Golden wattle flowers on a dark background' },
  { src: bottlebrushImg, alt: 'Red bottlebrush flowers and foliage' },
]

const HOME_QUICK_PATHS: { to: string; title: string; blurb: string; icon: ReactNode }[] = [
  {
    to: '/plants',
    title: 'Find native plants',
    blurb: 'Filter by your area, sun and soil to shortlist locals.',
    icon: <IconSearch />,
  },
  {
    to: '/weed#weed-checker',
    title: 'Plant safety check',
    blurb: 'See if something in your garden could be an environmental weed.',
    icon: <IconLeaf />,
  },
  {
    to: '/beginners',
    title: 'Beginner guides',
    blurb: 'Step-by-step help for your first native-friendly patch.',
    icon: <IconSprout />,
  },
  {
    to: '/learn#native',
    title: 'Why natives matter',
    blurb: 'Context on biodiversity, weeds and Victorian landscapes.',
    icon: <IconBook />,
  },
  {
    to: '/planner',
    title: 'Garden planner',
    blurb: 'Lay out a bed and try native species in a simple 3D planner.',
    icon: <IconPlanner />,
  },
  {
    to: '/map',
    title: 'Nursery map',
    blurb: 'Find native plant nurseries and public gardens across Victoria.',
    icon: <IconMap />,
  },
]

function HomeQuickPathsIntro() {
  const { elementRef, revealClass } = useScrollReveal<HTMLDivElement>('fade-up')
  return (
    <div ref={elementRef} className={`home-quick-paths__intro ${revealClass}`.trim()}>
      <p className="eyebrow home-quick-paths__eyebrow">Explore RootVio</p>
      <h2 id="home-quick-paths-heading" className="home-quick-paths__title">
        Where do you want to start?
      </h2>
    </div>
  )
}

type QuickPathItem = (typeof HOME_QUICK_PATHS)[number]

/** Pixels per second when auto-advancing the quick-paths carousel (off-strip only). */
const QUICK_PATHS_AUTO_SCROLL_PX_PER_SEC = 24

function pointInClientRect(x: number, y: number, r: DOMRect): boolean {
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

function HomeQuickPathCard({
  item,
  allowTab,
  isDuplicateStrip,
}: {
  item: QuickPathItem
  allowTab: boolean
  isDuplicateStrip: boolean
}) {
  return (
    <li className="home-quick-paths__cell" aria-hidden={isDuplicateStrip || undefined}>
      <Link
        to={item.to}
        className="home-quick-paths__card"
        tabIndex={allowTab ? undefined : -1}
      >
        <span className="home-quick-paths__icon" aria-hidden="true">
          {item.icon}
        </span>
        <span className="home-quick-paths__card-title">{item.title}</span>
        <span className="home-quick-paths__card-blurb">{item.blurb}</span>
      </Link>
    </li>
  )
}

function HomeQuickPathLoop() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const scrollWrapRef = useRef<HTMLDivElement>(null)
  const copiesRef = useRef(0)
  const segmentW = useRef(0)
  const isSyncing = useRef(false)
  /** Tracks desktop hover over the strip (pointer coords can be stale before first move). */
  const mouseOverStripRef = useRef(false)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const remeasureRef = useRef<() => void>(() => {})
  /** Fractional scroll budget — slow speeds need this or WebKit rounds tiny scrollBy to zero. */
  const autoScrollAccumRef = useRef(0)
  const [copies, setCopies] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 1
      : 3,
  )
  const { elementRef: revealRef, revealClass } = useScrollReveal<HTMLDivElement>('fade-up')

  useEffect(() => {
    copiesRef.current = copies
  }, [copies])

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      setCopies(mq.matches ? 1 : 3)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const remeasure = useCallback(() => {
    const el = trackRef.current
    if (!el || copies < 2) return
    const per = HOME_QUICK_PATHS.length
    const cells = el.querySelectorAll(':scope > li.home-quick-paths__cell')
    if (cells.length < per) return
    let total = 0
    for (let i = 0; i < per; i++) {
      total += (cells[i] as HTMLElement).getBoundingClientRect().width
    }
    const gap = parseFloat(getComputedStyle(el).gap || '0') || 0
    const w = Math.round(total + gap * Math.max(0, per - 1))
    if (w > 0) segmentW.current = w
  }, [copies])

  useEffect(() => {
    remeasureRef.current = remeasure
  }, [remeasure])

  const runAfterScrollQuiet = useCallback((fn: () => void) => {
    isSyncing.current = true
    requestAnimationFrame(() => {
      fn()
      requestAnimationFrame(() => {
        isSyncing.current = false
      })
    })
  }, [])

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    remeasure()
    if (copies >= 3 && segmentW.current > 0) {
      isSyncing.current = true
      scroller.scrollLeft = segmentW.current
      requestAnimationFrame(() => {
        isSyncing.current = false
      })
    }
  }, [copies, remeasure])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(() => {
      remeasure()
      const w = segmentW.current
      if (copies < 3 || !w) return
      const scroller = scrollerRef.current
      if (!scroller) return
      runAfterScrollQuiet(() => {
        const sl = scroller.scrollLeft
        if (sl >= 2 * w - 12) scroller.scrollLeft = sl - w
        else if (sl <= 12) scroller.scrollLeft = sl + w
        else if (scroller.scrollLeft === 0) scroller.scrollLeft = w
      })
    })
    ro.observe(track)
    const scroller = scrollerRef.current
    if (scroller) ro.observe(scroller)
    return () => ro.disconnect()
  }, [copies, remeasure, runAfterScrollQuiet])

  useEffect(() => {
    let rafId = 0
    let last = performance.now()

    const tick = (now: number) => {
      const scroller = scrollerRef.current
      const wrap = scrollWrapRef.current
      const dt = Math.min(48, now - last) / 1000
      last = now

      if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.hidden ||
        copiesRef.current < 3
      ) {
        autoScrollAccumRef.current = 0
        rafId = requestAnimationFrame(tick)
        return
      }

      let pauseForInteraction = false
      if (wrap) {
        if (mouseOverStripRef.current) {
          pauseForInteraction = true
        }
        const rect = wrap.getBoundingClientRect()
        const ptr = lastPointerRef.current
        if (!pauseForInteraction && ptr && pointInClientRect(ptr.x, ptr.y, rect)) {
          pauseForInteraction = true
        }
        if (!pauseForInteraction) {
          const ae = document.activeElement
          if (ae instanceof Node && wrap.contains(ae)) {
            pauseForInteraction = true
          }
        }
      }

      if (pauseForInteraction) {
        autoScrollAccumRef.current = 0
      }

      if (!pauseForInteraction && scroller) {
        let maxScroll = scroller.scrollWidth - scroller.clientWidth
        if (maxScroll <= 1) {
          remeasureRef.current()
          maxScroll = scroller.scrollWidth - scroller.clientWidth
        }
        if (maxScroll > 1) {
          autoScrollAccumRef.current += QUICK_PATHS_AUTO_SCROLL_PX_PER_SEC * dt
          const room = maxScroll - scroller.scrollLeft
          const step = Math.min(room, Math.floor(autoScrollAccumRef.current))
          if (step >= 1) {
            scroller.scrollBy({ left: step, top: 0, behavior: 'auto' })
            autoScrollAccumRef.current -= step
          }
        } else {
          autoScrollAccumRef.current = 0
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const onScroll = useCallback(() => {
    if (copies < 3 || isSyncing.current) return
    const el = scrollerRef.current
    const w = segmentW.current
    if (!el || !w) return
    const sl = el.scrollLeft
    const edge = 16
    if (sl >= 2 * w - edge) {
      runAfterScrollQuiet(() => {
        const wRun = segmentW.current
        const cur = el.scrollLeft
        if (wRun > 0 && cur >= 2 * wRun - edge) el.scrollLeft = cur - wRun
      })
    } else if (sl <= edge) {
      runAfterScrollQuiet(() => {
        const wRun = segmentW.current
        const cur = el.scrollLeft
        if (wRun > 0 && cur <= edge) el.scrollLeft = cur + wRun
      })
    }
  }, [copies, runAfterScrollQuiet])

  const loops = Array.from({ length: copies }, (_, copyIndex) =>
    HOME_QUICK_PATHS.map((item) => (
      <HomeQuickPathCard
        key={`${copyIndex}-${item.to}`}
        item={item}
        isDuplicateStrip={copies > 1 && copyIndex !== 1}
        allowTab={copies === 1 || copyIndex === 1}
      />
    )),
  )

  return (
    <div
      ref={revealRef}
      className={`home-quick-paths__fullbleed ${revealClass}`.trim()}
    >
      <div
        ref={scrollWrapRef}
        className="home-quick-paths__scroll-wrap"
        onMouseEnter={() => {
          mouseOverStripRef.current = true
        }}
        onMouseLeave={() => {
          mouseOverStripRef.current = false
        }}
      >
        <div ref={scrollerRef} className="home-quick-paths__viewport" onScroll={onScroll}>
          <ul ref={trackRef} className="home-quick-paths__grid" role="list">
            {loops.flat()}
          </ul>
        </div>
      </div>
    </div>
  )
}

const INVASIVE_IMPACT_STATS: {
  value: string
  label: string
  source: string
  href: string
}[] = [
  {
    value: '~54%',
    label: 'Of Victoria’s original native vegetation estimated cleared since European settlement.',
    source: 'VAGO (citing DELWP)',
    href: 'https://www.audit.vic.gov.au/report/offsetting-native-vegetation-loss-private-land/',
  },
  {
    value: '$24.5B',
    label: 'Estimated yearly cost of invasive species to Australia — plants are the largest share.',
    source: 'CSIRO (NeoBiota, 2021)',
    href: 'https://www.csiro.au/',
  },
  {
    value: '100+',
    label: 'Australian endemic species recognised as extinct or extinct in the wild since 1788.',
    source: 'Woinarski et al. (2019)',
    href: 'https://doi.org/10.1016/j.biocon.2019.07.026',
  },
]

type NativePlantBenefit = {
  text: string
  /** Optional full-bleed background (more can be added later). */
  image?: string
}

function benefitBackgroundStyle(src: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(135deg, rgba(11, 28, 13, 0.78) 0%, rgba(11, 28, 13, 0.42) 45%, rgba(11, 28, 13, 0.76) 100%), url(${src})`,
    backgroundSize: 'cover, cover',
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat',
  }
}

const NATIVE_PLANT_BENEFITS: NativePlantBenefit[] = [
  {
    text: 'Support local pollinators, birds and soil life that co-evolved with Victorian flora.',
    image: benefitPollinatorsBg,
  },
  {
    text: 'Often need less water and fertiliser once established — easier on your patch and runoff.',
    image: benefitKangarooPawBg,
  },
  {
    text: 'Australia’s natural landscapes support economic activity and jobs that flow through to households nationwide.',
    image: benefitNaturalEconomyBg,
  },
  {
    text: 'Time in gardens and green spaces is linked to less stress, better mood, and better overall health.',
    image: benefitWellbeingBg,
  },
]

function HomeImpactStatCard({
  stat,
  index,
}: {
  stat: (typeof INVASIVE_IMPACT_STATS)[number]
  index: number
}) {
  const { elementRef, revealClass } = useScrollReveal<HTMLElement>('rise-scale')
  const delayStyle = { '--reveal-delay': `${index * 90}ms` } as CSSProperties
  return (
    <article
      ref={elementRef}
      className={`learn-stat learn-stat--alt ${revealClass}`.trim()}
      style={delayStyle}
    >
      <p className="learn-stat__value">{stat.value}</p>
      <p className="learn-stat__label">{stat.label}</p>
      <p className="learn-stat__source">
        <a href={stat.href} target="_blank" rel="noopener noreferrer">
          {stat.source}
        </a>
      </p>
    </article>
  )
}

function HomeNativeBenefitCard({ item, index }: { item: NativePlantBenefit; index: number }) {
  const { elementRef, revealClass } = useScrollReveal<HTMLElement>('rise-scale')
  const delayStyle = { '--reveal-delay': `${index * 75}ms` } as CSSProperties
  return (
    <article
      ref={elementRef}
      className={`card home-native-benefits__box${item.image ? ' home-native-benefits__box--has-bg' : ''} ${revealClass}`.trim()}
      role="listitem"
      tabIndex={0}
      style={item.image ? { ...benefitBackgroundStyle(item.image), ...delayStyle } : delayStyle}
    >
      <div className="home-native-benefits__inner">
        <div className="home-native-benefits__head">
          <span className="home-native-benefits__title">{item.title}</span>
        </div>
        <p className="home-native-benefits__body">{item.body}</p>
      </div>
    </article>
  )
}

function HomeImpactWeedRotator() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % WEED_EXAMPLE_SLIDES.length)
    }, 4800)

    return () => window.clearInterval(id)
  }, [])

  const liveLabel = WEED_EXAMPLE_SLIDES[idx]?.alt ?? ''

  return (
    <div className="home-impact__weeds-card card">
      <div
        className="home-impact-weeds-slideshow"
        aria-live="polite"
        aria-atomic="true"
        aria-label={liveLabel}
      >
        {WEED_EXAMPLE_SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`home-impact-weeds-slide${i === idx ? ' home-impact-weeds-slide--active' : ''}`}
            style={{ backgroundImage: `url(${slide.src})` }}
          />
        ))}
      </div>
      <p className="home-impact-weeds-caption">
        Plants like these can escape from gardens and damage native bushland.
      </p>
      <p className="home-native-benefits__photo-credit">
        <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
          Unsplash
        </a>
        :{' '}
        <a href="https://unsplash.com/photos/TotuOjWlLgU" target="_blank" rel="noopener noreferrer">
          Yashika g
        </a>
        {' · '}
        <a href="https://unsplash.com/photos/7FN-K3-5xGg" target="_blank" rel="noopener noreferrer">
          Piaras Jackson
        </a>
        {' · '}
        <a href="https://unsplash.com/photos/r5_PqJLV3jw" target="_blank" rel="noopener noreferrer">
          Annie Spratt
        </a>
        .
      </p>
    </div>
  )
}

export function HomePage() {
  const { elementRef: impactTitleRef, revealClass: impactTitleRevealClass } =
    useScrollReveal<HTMLDivElement>('fade-up')
  const { elementRef: impactBodyRef, revealClass: impactBodyRevealClass } =
    useScrollReveal<HTMLDivElement>('slide-right')
  const { elementRef: impactAsideRef, revealClass: impactAsideRevealClass } =
    useScrollReveal<HTMLElement>('slide-left')
  const { elementRef: impactMoreRef, revealClass: impactMoreRevealClass } =
    useScrollReveal<HTMLParagraphElement>('fade-in')
  const { elementRef: benefitsTitleRef, revealClass: benefitsTitleRevealClass } =
    useScrollReveal<HTMLHeadingElement>('fade-up')

  return (
    <>
      <section className="hero fade-up">
        <div className="hero-slideshow" aria-hidden="true">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className={`hero-slide hero-slide--${i + 1}`}
              style={{ backgroundImage: `url(${slide.src})` }}
              role="img"
              aria-label={slide.alt}
            />
          ))}
        </div>
        <div className="hero-inner">
          <div className="hero-brand">
            <img src={logoImg} alt="" className="hero-brand__logo" aria-hidden="true" />
            <span className="hero-brand__text">RootVio</span>
          </div>
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Sustainable gardening
          </p>
          <h1 className="hero-title">
            <span className="hero-title__line">Grow smart.</span>
            <span className="hero-title__line">Garden responsibly.</span>
          </h1>
          <p>
            Plan with native-friendly choices, spot invasive species early, and build a garden that
            supports local biodiversity.
          </p>
          <div className="hero-cta-row">
            <Link to="/plants" className="btn btn-primary">
              Start Gardening
            </Link>
            <Link to="/weed#weed-checker" className="btn btn-secondary">
              Weed checker
            </Link>
          </div>
        </div>
      </section>

      <section className="section-block home-impact" aria-labelledby="home-impact-heading">
        <h2 id="home-impact-heading">Why invasive species matter</h2>
        <div className="home-impact__layout">
          <div
            ref={impactTitleRef}
            className={`home-impact__lead ${impactTitleRevealClass}`.trim()}
          >
            <h2 id="home-impact-heading" className="home-impact__heading">
              Why environmental weeds matter
            </h2>
            <p className="home-section-lead">
              Environmental weeds are plants—often from gardens—that spread into bushland and
              waterways and outcompete local species, damaging habitats we all share.
            </p>
          </div>
          <div
            className={`home-impact__body ${impactBodyRevealClass}`.trim()}
            ref={impactBodyRef}
          >
            <p>
              Choosing native alternatives helps protect the environment, and every garden contributes
              to the bigger picture.
            </p>
          </div>
          <aside
            className={`home-impact__aside ${impactAsideRevealClass}`.trim()}
            aria-label="Examples of environmental weeds"
            ref={impactAsideRef}
          >
            <HomeImpactWeedRotator />
          </aside>
          <div className="home-impact__stats">
            <div className="learn-stats">
              {INVASIVE_IMPACT_STATS.map((s) => (
                <article key={s.value} className="learn-stat learn-stat--alt">
                  <p className="learn-stat__value">{s.value}</p>
                  <p className="learn-stat__label">{s.label}</p>
                  <p className="learn-stat__source">
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      {s.source}
                    </a>
                  </p>
                </article>
              ))}
            </div>
            <p
              className={`home-impact__more ${impactMoreRevealClass}`.trim()}
              ref={impactMoreRef}
            >
              <Link to="/learn#environmental-weeds" className="home-impact__more-link">
                Read more on environmental weeds
              </Link>
              <span className="home-impact__more-sep" aria-hidden="true">
                ·
              </span>
              <Link to="/weed#top-weeds" className="home-impact__more-link">
                Browse top weeds in Victoria
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section-block home-benefits-block" aria-labelledby="home-benefits-heading">
        <h2
          id="home-benefits-heading"
          ref={benefitsTitleRef}
          className={benefitsTitleRevealClass}
        >
          Benefits of native plants
        </h2>
        <p className="home-section-lead">
          Native plants are species that evolved in your region and belong naturally in local
          ecosystems, supporting wildlife without being introduced from elsewhere.
        </p>
        <div className="home-native-benefits">
          <div className="home-native-benefits__grid" role="list">
            {NATIVE_PLANT_BENEFITS.map((item, i) => (
              <article
                key={item.text}
                className={`card home-native-benefits__box${item.image ? ' home-native-benefits__box--has-bg' : ''}`}
                role="listitem"
                style={item.image ? benefitBackgroundStyle(item.image) : undefined}
              >
                <span className="home-native-benefits__index" aria-hidden="true">
                  {i + 1}
                </span>
                <p className="home-native-benefits__text">{item.text}</p>
              </article>
            ))}
          </div>
          <p className="home-native-benefits__footnote">
            <Link to="/learn#native">Native plants 101 on the Learn page</Link> ties these ideas to
            Victoria’s <em>Biodiversity 2037</em> goals.
          </p>
          <p className="home-native-benefits__photo-credit">Kangaroo paw photograph: John Jennings.</p>
          <p className="home-native-benefits__photo-credit">
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
            :{' '}
            <a href="https://unsplash.com/photos/EiKgz_46i70" target="_blank" rel="noopener noreferrer">
              Photo by Pen Ash
            </a>
            {' · '}
            <a href="https://unsplash.com/photos/19SC2oaVZW0" target="_blank" rel="noopener noreferrer">
              Photo by Kazuend
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}
