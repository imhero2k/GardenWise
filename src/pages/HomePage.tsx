import { Link } from 'react-router-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { IconBook, IconLeaf, IconMap, IconPlanner, IconSearch, IconSprout } from '../components/Icons'
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
    alt: 'Low-growing environmental weed with spiky white flower clusters among grass.',
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
  const { ref, revealClass } = useScrollReveal<HTMLDivElement>('fade-up')
  return (
    <div ref={ref} className={`home-quick-paths__intro ${revealClass}`.trim()}>
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
  const { ref: revealRef, revealClass } = useScrollReveal<HTMLDivElement>('fade-up')

  copiesRef.current = copies

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

  remeasureRef.current = remeasure
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
    label: 'Estimated yearly cost of environmental weeds to Australia — plants are the largest share.',
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
  title: string
  body: string
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
    title: 'Support local wildlife',
    body: 'Pollinators, birds and soil life co-evolved with Victorian natives and thrive when those plants are in your garden.',
    image: benefitPollinatorsBg,
  },
  {
    title: 'Save water',
    body: 'Established natives survive on rainfall alone, cutting garden water use compared to exotic species.',
    image: benefitKangarooPawBg,
  },
  {
    title: 'Support the economy',
    body: 'Australia’s natural landscapes support economic activity and jobs that flow through to households nationwide.',
    image: benefitNaturalEconomyBg,
  },
  {
    title: 'Low maintenance',
    body: 'Choose the right plant for your garden and spend less time mowing, pruning and battling pests.',
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
  const { ref, revealClass } = useScrollReveal<HTMLElement>('rise-scale')
  const delayStyle = { '--reveal-delay': `${index * 90}ms` } as CSSProperties
  return (
    <article
      ref={ref}
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
  const { ref, revealClass } = useScrollReveal<HTMLElement>('rise-scale')
  const delayStyle = { '--reveal-delay': `${index * 75}ms` } as CSSProperties
  return (
    <article
      ref={ref}
      className={`card home-native-benefits__box${item.image ? ' home-native-benefits__box--has-bg' : ''} ${revealClass}`.trim()}
      role="listitem"
      style={item.image ? { ...benefitBackgroundStyle(item.image), ...delayStyle } : delayStyle}
    >
      <span className="home-native-benefits__index" aria-hidden="true">
        {index + 1}
      </span>
      <div className="home-native-benefits__text">
        <span className="home-native-benefits__title">{item.title}</span>
        <span className="home-native-benefits__body">{item.body}</span>
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
  const impactTitleReveal = useScrollReveal<HTMLHeadingElement>('fade-up')
  const impactBodyReveal = useScrollReveal<HTMLDivElement>('slide-right')
  const impactAsideReveal = useScrollReveal<HTMLElement>('slide-left')
  const impactMoreReveal = useScrollReveal<HTMLParagraphElement>('fade-in')
  const benefitsTitleReveal = useScrollReveal<HTMLHeadingElement>('fade-up')

  return (
    <>
      <section className="hero home-hero">
        <div className="home-hero__ambient" aria-hidden="true">
          <span className="home-hero__orb home-hero__orb--a" />
          <span className="home-hero__orb home-hero__orb--b" />
        </div>
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
          <div className="hero-brand home-hero__rise home-hero__rise--d0">
            <img src={logoImg} alt="" className="hero-brand__logo" aria-hidden="true" />
            <span className="hero-brand__text">RootVio</span>
          </div>
          <p
            className="eyebrow home-hero__rise home-hero__rise--d1"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            Sustainable gardening
          </p>
          <h1 className="hero-title">
            <span className="hero-title__line home-hero__rise home-hero__rise--d2">Grow smart.</span>
            <span className="hero-title__line home-hero__rise home-hero__rise--d3">
              Garden responsibly.
            </span>
          </h1>
          <p className="home-hero__rise home-hero__rise--d4">
            Every garden counts. RootVio empowers Victorian gardeners to grow local, remove
            environmental weeds, and protect the biodiversity that makes this state extraordinary.
          </p>
          <div className="hero-cta-row home-hero__rise home-hero__rise--d5">
            <Link to="/plants" className="btn btn-primary home-hero__cta-btn">
              Start Gardening
            </Link>
            <Link to="/weed#weed-checker" className="btn btn-secondary home-hero__cta-btn">
              Weed checker
            </Link>
          </div>
        </div>
      </section>

      <section className="home-quick-paths section-block" aria-labelledby="home-quick-paths-heading">
        <HomeQuickPathsIntro />
        <HomeQuickPathLoop />
      </section>

      <section className="section-block home-impact" aria-labelledby="home-impact-heading">
        <h2
          id="home-impact-heading"
          ref={impactTitleReveal.ref}
          className={`home-impact__heading ${impactTitleReveal.revealClass}`.trim()}
        >
          Why environmental weeds matter
        </h2>
        <div className="home-impact__layout">
          <div
            className={`home-impact__body ${impactBodyReveal.revealClass}`.trim()}
            ref={impactBodyReveal.ref}
          >
            <p>
              Victoria’s natural environment is shared by everyone, and even home gardens can
              significantly impact it.
            </p>
            <p>
              Some common garden plants can escape and become environmental weeds, harming native
              ecosystems and wildlife.
            </p>
            <p>
              Choosing native alternatives helps protect the environment, and every garden contributes
              to the bigger picture.
            </p>
          </div>
          <aside
            className={`home-impact__aside ${impactAsideReveal.revealClass}`.trim()}
            aria-label="Examples of environmental weeds"
            ref={impactAsideReveal.ref}
          >
            <HomeImpactWeedRotator />
          </aside>
          <div className="home-impact__stats">
            <div className="learn-stats">
              {INVASIVE_IMPACT_STATS.map((s, i) => (
                <HomeImpactStatCard key={s.value} stat={s} index={i} />
              ))}
            </div>
            <p
              className={`home-impact__more ${impactMoreReveal.revealClass}`.trim()}
              ref={impactMoreReveal.ref}
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

      <section className="section-block">
        <h2 ref={benefitsTitleReveal.ref} className={benefitsTitleReveal.revealClass}>
          Benefits of native plants
        </h2>
        <div className="home-native-benefits">
          <div className="home-native-benefits__grid" role="list">
            {NATIVE_PLANT_BENEFITS.map((item, i) => (
              <HomeNativeBenefitCard key={item.title} item={item} index={i} />
            ))}
          </div>
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
