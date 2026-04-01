import type { RiskLevel } from '../types/plant'

const labels: Record<RiskLevel, string> = {
  Low: 'Low risk',
  Medium: 'Medium risk',
  High: 'High risk',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const cls =
    level === 'Low' ? 'badge-low' : level === 'Medium' ? 'badge-medium' : 'badge-high'
  return (
    <span className={`badge ${cls}`} title={`Invasive risk: ${level}`}>
      {labels[level]}
    </span>
  )
}
