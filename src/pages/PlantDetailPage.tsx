import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { getPlantById } from '../data/plants'
import { RiskBadge } from '../components/RiskBadge'

export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addPlant, hasPlant } = useGarden()
  const plant = id ? getPlantById(id) : undefined

  if (!plant) {
    return (
      <div className="card card-body">
        <h1>Plant not found</h1>
        <p>
          <Link to="/plants">Back to PlantMe</Link>
        </p>
      </div>
    )
  }

  const inGarden = hasPlant(plant.id)
  const highRisk = plant.invasiveRisk === 'High'

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 'var(--space-md)' }}
      >
        ← Back
      </button>

      <div className="detail-hero">
        <img src={plant.image} alt="" />
        <div className="detail-hero__overlay">
          <h1>{plant.name}</h1>
          <p className="sci">{plant.scientificName}</p>
        </div>
      </div>

      <div className="detail-section">
        <h2>Invasive risk</h2>
        <div className={`risk-banner${highRisk ? ' risk-banner--high' : ''}`}>
          <RiskBadge level={plant.invasiveRisk} />
          <p style={{ margin: highRisk ? 'var(--space-sm) 0 0' : 0, fontSize: '0.95rem' }}>
            {highRisk
              ? 'High-risk species can escape into bushland and outcompete natives. Consider removing or replacing with local alternatives.'
              : plant.invasiveRisk === 'Medium'
                ? 'Monitor spread in warm, wet climates and keep contained where advised by your council.'
                : 'Lower invasive potential when grown responsibly in suitable conditions.'}
          </p>
        </div>
      </div>

      <div className="detail-section">
        <h2>Growing conditions</h2>
        <div className="card card-body">
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--color-text-muted)' }}>
            <li>
              <strong style={{ color: 'var(--color-text)' }}>Sunlight:</strong> {plant.sunlight}
            </li>
            <li>
              <strong style={{ color: 'var(--color-text)' }}>Water:</strong> {plant.water}
            </li>
            <li>
              <strong style={{ color: 'var(--color-text)' }}>Soil pH:</strong> {plant.soilPh}
            </li>
          </ul>
        </div>
      </div>

      <div className="detail-section">
        <h2>Companion plants</h2>
        <div className="companion-lists">
          <div className="companion-box">
            <h3 style={{ color: 'var(--color-success)' }}>Good companions</h3>
            <ul>
              {plant.companionsGood.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div className="companion-box">
            <h3 style={{ color: 'var(--color-warning)' }}>Avoid pairing</h3>
            <ul>
              {plant.companionsBad.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h2>Seasonal suitability</h2>
        <div className="season-pill-row">
          {plant.seasons.map((s) => (
            <span key={s} className="badge badge-neutral">
              {s}
            </span>
          ))}
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: 'var(--space-md)' }}>
          {plant.seasonalNote}
        </p>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={inGarden}
        onClick={() => addPlant(plant.id)}
      >
        {inGarden ? 'Already in My Garden' : 'Add to My Garden'}
      </button>
    </>
  )
}
