import { Link } from 'react-router-dom'
import { IconBook, IconCamera, IconLeaf, IconMap, IconPlanner, IconSearch } from '../components/Icons'
import waratahImg from '../assets/hero/waratah.png'
import wattleImg from '../assets/hero/wattle.png'
import bottlebrushImg from '../assets/hero/bottlebrush.png'
import logoImg from '../assets/logo.png'

const HERO_SLIDES: { src: string; alt: string }[] = [
  { src: waratahImg, alt: 'Waratah in bloom against native bushland' },
  { src: wattleImg, alt: 'Golden wattle flowers on a dark background' },
  { src: bottlebrushImg, alt: 'Red bottlebrush flowers and foliage' },
]

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

      <div className="section-block">
        <h2>Explore</h2>
        <div className="feature-grid">
          <Link to="/weed#weed-checker" className="feature-tile">
            <div className="feature-tile__icon">
              <IconLeaf />
            </div>
            <div>
              <h3>Plant Safety Check</h3>
              <p>Scan or upload a plant to check invasive risk before you plant.</p>
            </div>
          </Link>
          <Link to="/plants" className="feature-tile">
            <div className="feature-tile__icon">
              <IconSearch />
            </div>
            <div>
              <h3>PlantMe</h3>
              <p>Search and discover recommended plants for your area.</p>
            </div>
          </Link>
          <Link to="/planner" className="feature-tile">
            <div className="feature-tile__icon">
              <IconPlanner />
            </div>
            <div>
              <h3>Garden planner</h3>
              <p>Lay out your garden in 3D and space plants properly for mature size.</p>
            </div>
          </Link>
          <Link to="/learn" className="feature-tile">
            <div className="feature-tile__icon">
              <IconBook />
            </div>
            <div>
              <h3>Native plants 101</h3>
              <p>
                Why native plants matter for Victoria — and how your garden helps. Based on
                Biodiversity 2037.
              </p>
            </div>
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            className="animate-float"
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(46, 125, 50, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <IconCamera />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ marginBottom: '0.35rem' }}>Quick tools</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Use <strong>PlantMe</strong> to search species, or open the <strong>nursery map</strong>{' '}
              to find low-invasive stock near you.
            </p>
          </div>
          <Link to="/map" className="btn btn-secondary btn-sm">
            <IconMap /> Nursery map
          </Link>
        </div>
      </div>
    </>
  )
}
