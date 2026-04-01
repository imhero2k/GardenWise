import { Link } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { RiskBadge } from '../components/RiskBadge'

function healthClass(h: string) {
  if (h === 'Thriving') return 'health-thriving'
  if (h === 'Good') return 'health-good'
  return 'health-care'
}

export function MyGardenPage() {
  const { gardenPlants } = useGarden()

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Your space</p>
        <h1>Manage My Garden</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Health, watering, and invasive alerts for plants you have added.
        </p>
      </header>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <Link to="/plants" className="btn btn-primary">
          Add New Plant
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {gardenPlants.map((gp) => (
          <div key={gp.id} className="card garden-card card-body">
            <Link to={`/plants/${gp.id}`} className="garden-card-thumb">
              <img src={gp.image} alt="" />
            </Link>
            <div>
              <Link
                to={`/plants/${gp.id}`}
                style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}
              >
                {gp.name}
              </Link>
              <div style={{ marginTop: '0.35rem' }}>
                <span className={`health-badge ${healthClass(gp.health)}`}>{gp.health}</span>
                {gp.invasiveRisk === 'High' && (
                  <span className="badge badge-high" title="Invasive risk">
                    Risk alert
                  </span>
                )}
              </div>
              <p className="water-hint">
                Water reminder: <strong>{gp.waterDue}</strong>
              </p>
              {gp.invasiveRisk === 'High' && (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-danger)', margin: '0.35rem 0 0' }}>
                  Replace or contain — high invasive potential in many regions.
                </p>
              )}
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <RiskBadge level={gp.invasiveRisk} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {gardenPlants.length === 0 && (
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No plants yet.</p>
          <Link to="/plants" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
            Browse PlantMe
          </Link>
        </div>
      )}
    </>
  )
}
