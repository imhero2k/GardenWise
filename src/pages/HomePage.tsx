import { Link } from 'react-router-dom'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { IconBook, IconLeaf, IconMap, IconPlanner, IconSearch, IconSprout } from '../components/Icons'
import waratahImg from '../assets/hero/waratah.png'
import wattleImg from '../assets/hero/wattle.png'
import bottlebrushImg from '../assets/hero/bottlebrush.png'
import benefitPollinatorsBg from '../assets/home/benefit-pollinators-bg.png'
import benefitKangarooPawBg from '../assets/home/benefit-kangaroo-paw-bg.png'
import benefitNaturalEconomyBg from '../assets/home/benefit-natural-economy-bg.png'
import benefitWellbeingBg from '../assets/home/benefit-wellbeing-bg.png'
import weedRotatorKhaki from '../assets/home/weed-rotator-khaki.png'
import weedRotatorThistle from '../assets/home/weed-rotator-thistle.png'
import weedRotatorGorse from '../assets/home/weed-rotator-gorse.png'
import { HOME_IMPACT_STATS } from '../data/educationStats'

const WEED_EXAMPLE_SLIDES: { src: string; name: string }[] = [
  { src: weedRotatorKhaki, name: 'Khaki weed' },
  { src: weedRotatorThistle, name: 'Scotch thistle' },
  { src: weedRotatorGorse, name: 'Gorse' },
]

const HERO_SLIDES: { src: string; alt: string }[] = [
  { src: waratahImg, alt: 'Waratah in bloom against native bushland' },
  { src: wattleImg, alt: 'Golden wattle flowers on a dark background' },
  { src: bottlebrushImg, alt: 'Red bottlebrush flowers and foliage' },
]

const HOME_QUICK_PATHS: { to: string; title: string; icon: ReactNode }[] = [
  { to: '/plants', title: 'Find native plants', icon: <IconSearch /> },
  { to: '/weed#weed-checker', title: 'Identify a plant', icon: <IconLeaf /> },
  { to: '/beginners', title: 'Beginner guides', icon: <IconSprout /> },
  { to: '/learn#native', title: 'Why natives matter', icon: <IconBook /> },
  { to: '/planner', title: 'Garden planner', icon: <IconPlanner /> },
  { to: '/map', title: 'Nursery map', icon: <IconMap /> },
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
      </Link>
    </li>
  )
}

function HomeQuickPathLoop() {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const segmentW = useRef(0)
  const lastResizeSegmentW = useRef(0)
  const isSyncing = useRef(false)
  const [copies, setCopies] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 1
      : 3,
  )
  const { elementRef: revealRef, revealClass } = useScrollReveal<HTMLDivElement>('fade-up')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setCopies(mq.matches ? 1 : 3)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const remeasure = useCallback(() => {
    const el = trackRef.current
    const scroller = scrollerRef.current
    if (!el || copies < 2) return

    if (copies >= 3 && scroller && scroller.scrollWidth > 0) {
      const wFromScroll = Math.round(scroller.scrollWidth / copies)
      if (wFromScroll > 0) {
        segmentW.current = wFromScroll
        return
      }
    }

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

  const syncInfiniteScroll = useCallback(
    (el: HTMLDivElement) => {
      const w = segmentW.current
      if (!w || copies < 3) return
      const sl = el.scrollLeft
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
      const edge = 16

      if (sl >= 2 * w - edge || sl >= maxScroll - edge) {
        el.scrollLeft = sl - w
      } else if (sl <= edge) {
        el.scrollLeft = sl + w
      }
    },
    [copies],
  )

  const runAfterScrollQuiet = useCallback((fn: () => void) => {
    isSyncing.current = true
    requestAnimationFrame(() => {
      try {
        fn()
      } finally {
        requestAnimationFrame(() => {
          isSyncing.current = false
        })
      }
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
    lastResizeSegmentW.current = 0
    const ro = new ResizeObserver(() => {
      remeasure()
      const w = segmentW.current
      if (copies < 3 || !w) return
      const prev = lastResizeSegmentW.current
      if (prev !== 0 && Math.abs(w - prev) < 1) return
      lastResizeSegmentW.current = w
      const scroller = scrollerRef.current
      if (!scroller) return
      runAfterScrollQuiet(() => {
        if (scroller) syncInfiniteScroll(scroller)
      })
    })
    ro.observe(track)
    const scroller = scrollerRef.current
    if (scroller) ro.observe(scroller)
    return () => ro.disconnect()
  }, [copies, remeasure, runAfterScrollQuiet, syncInfiniteScroll])

  const onScroll = useCallback(() => {
    if (copies < 3 || isSyncing.current) return
    const el = scrollerRef.current
    if (!el) return
    runAfterScrollQuiet(() => syncInfiniteScroll(el))
  }, [copies, runAfterScrollQuiet, syncInfiniteScroll])

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
    <div ref={revealRef} className={`home-quick-paths__fullbleed ${revealClass}`.trim()}>
      <div className="home-quick-paths__scroll-wrap">
        <div
          ref={scrollerRef}
          className="home-quick-paths__viewport"
          tabIndex={0}
          aria-label="Explore RootVio — scroll horizontally to browse"
          onScroll={onScroll}
        >
          <ul ref={trackRef} className="home-quick-paths__grid" role="list">
            {loops.flat()}
          </ul>
        </div>
      </div>
    </div>
  )
}

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
  stat: (typeof HOME_IMPACT_STATS)[number]
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

  const liveLabel = WEED_EXAMPLE_SLIDES[idx]?.name ?? ''

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
            role="img"
            aria-label={slide.name}
          >
            <span className="home-impact-weeds-slide__name">{slide.name}</span>
          </div>
        ))}
      </div>
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
          <h1 className="hero-title home-hero__title home-hero__rise home-hero__rise--d0">
            <span className="hero-title__line">Grow smart.</span>
            <span className="hero-title__line">Garden responsibly.</span>
          </h1>
          <p className="home-hero__rise home-hero__rise--d1">
            Every garden counts. RootVio empowers Victorian gardeners to grow local, remove
            environmental weeds, and protect the biodiversity that makes this state extraordinary.
          </p>
          <div className="home-hero__ctas home-hero__rise home-hero__rise--d2">
            <div className="hero-cta-row">
              <Link to="/weed#weed-checker" className="btn btn-secondary home-hero__cta-btn">
                Identify a plant
              </Link>
              <Link to="/plants" className="btn btn-primary home-hero__cta-btn">
                Start Gardening
              </Link>
            </div>
            <div className="hero-cta-row home-hero__cta-row--below">
              <Link
                to="/planner"
                className="btn home-hero__cta-btn home-hero__cta-btn--planner"
              >
                Plan your garden
              </Link>
            </div>
          </div>
        </div>
        <a href="#home-quick-paths" className="home-hero__scroll-hint">
          <span className="home-hero__scroll-hint-label">Scroll</span>
          <span className="home-hero__scroll-hint-chevron" aria-hidden />
        </a>
      </section>

      <section
        id="home-quick-paths"
        className="home-quick-paths section-block"
        aria-labelledby="home-quick-paths-heading"
      >
        <HomeQuickPathsIntro />
        <HomeQuickPathLoop />
      </section>

      <section className="section-block home-impact" aria-labelledby="home-impact-heading">
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
              {HOME_IMPACT_STATS.map((s, i) => (
                <HomeImpactStatCard key={s.value} stat={s} index={i} />
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
        <div className="home-native-benefits">
          <div className="home-native-benefits__grid" role="list">
            {NATIVE_PLANT_BENEFITS.map((item, i) => (
              <HomeNativeBenefitCard key={item.title} item={item} index={i} />
            ))}
          </div>
          <p className="home-native-benefits__photo-credit">Kangaroo paw photograph: John Jennings.</p>
          <p className="home-native-benefits__photo-credit">
            Photographs on this page from{' '}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}
