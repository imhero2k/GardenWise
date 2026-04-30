import { Link } from 'react-router-dom'
import type { Plant } from '../types/plant'
import { RiskBadge } from './RiskBadge'
import { IconDroplet, IconSun } from './Icons'

export function PlantCard({ plant }: { plant: Plant }) {
  return (
    <Link
      to={`/plants/${plant.id}`}
      className="card card-interactive plant-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="plant-card-image-wrap">
        <img src={plant.image} alt="" loading="lazy" />
        <div className="plant-card-badges">
          <RiskBadge level={plant.invasiveRisk} />
        </div>
      </div>
      <div className="card-body">
        <h3 className="plant-card-title">{plant.name}</h3>
        <p className="plant-card-sci">{plant.scientificName}</p>
        <div className="plant-card-tags">
          <span className="mini-tag">
            <IconSun /> {plant.sunlight}
          </span>
          <span className="mini-tag">
            <IconDroplet /> {plant.water}
          </span>
        </div>
      </div>
    </Link>
  )
}
