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
            <span className="hero-brand__text">GardenWise</span>
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
          <div className="home-impact__body">
            <p>
              Victoria’s natural environment is shared by everyone, and even home gardens can
              significantly impact it.
            </p>
            <p>
              Some common garden plants can escape and become invasive weeds, harming native
              ecosystems and wildlife.
            </p>
            <p>
              Choosing native alternatives helps protect the environment, and every garden contributes
              to the bigger picture.
            </p>
          </div>
          <aside className="home-impact__aside" aria-label="Examples of invasive weeds">
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
            <p className="home-impact__more">
              <Link to="/learn#invasive">Read more on environmental weeds</Link>
              {' · '}
              <Link to="/weed#top-weeds">Browse top weeds in Victoria</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section-block">
        <h2>Benefits of native plants</h2>
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
