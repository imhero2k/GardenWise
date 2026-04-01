import { Link } from 'react-router-dom'
import { IconCamera, IconLeaf, IconMap, IconSearch, IconSprout, IconUsers } from '../components/Icons'

export function HomePage() {
  return (
    <>
      <header className="top-bar">
        <span className="app-brand">GardenWise</span>
      </header>

      <section className="hero fade-up">
        <div className="hero-inner">
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Sustainable gardening
          </p>
          <h1>Grow Smart. Garden Responsibly.</h1>
          <p>
            Plan with native-friendly choices, spot invasive species early, and build a garden that
            supports local biodiversity.
          </p>
          <div className="hero-cta-row">
            <Link to="/plants" className="btn btn-primary">
              Start Gardening
            </Link>
            <Link to="/seasonal" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--color-primary-dark)' }}>
              Seasonal tips
            </Link>
          </div>
        </div>
      </section>

      <div className="section-block">
        <h2>Explore</h2>
        <div className="feature-grid">
          <Link to="/weed" className="feature-tile">
            <div className="feature-tile__icon">
              <IconLeaf />
            </div>
            <div>
              <h3>Plant Safety Check</h3>
              <p>Scan or upload a plant to check invasive risk before you plant.</p>
            </div>
          </Link>
          <Link to="/seasonal" className="feature-tile">
            <div className="feature-tile__icon">
              <IconSearch />
            </div>
            <div>
              <h3>Seasonal Recommendations</h3>
              <p>What to grow now — with eco-friendly tips for Australian climates.</p>
            </div>
          </Link>
          <Link to="/garden" className="feature-tile">
            <div className="feature-tile__icon">
              <IconSprout />
            </div>
            <div>
              <h3>Manage Your Garden</h3>
              <p>Track plants, watering, and alerts in one calm dashboard.</p>
            </div>
          </Link>
          <Link to="/community" className="feature-tile">
            <div className="feature-tile__icon">
              <IconUsers />
            </div>
            <div>
              <h3>Community Gallery</h3>
              <p>Get inspired by gardens across Australia — like, comment, and share.</p>
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
