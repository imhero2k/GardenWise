import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTemperatureAlert } from '../hooks/useTemperatureAlert'
import { HEAT_THRESHOLD_C, type FrostWindow, type HeatWindow } from '../lib/weather'
import { IconFrost, IconSun } from './Icons'

type AlertVariant = 'frost' | 'heat'

type BadgeConfig = {
  activeStatus: 'frost' | 'heat'
  classPrefix: string
  guidePath: string
  icon: ReactNode
  labelNow: string
  labelSoon: (hours: number) => string
  temp: (data: FrostWindow | HeatWindow) => number
  title: (urgency: 'urgent' | 'advance', hoursUntil: number, temp: number) => string
}

const BADGES: Record<AlertVariant, BadgeConfig> = {
  frost: {
    activeStatus: 'frost',
    classPrefix: 'frost-badge',
    guidePath: '/beginners/extreme-cold',
    icon: <IconFrost className="frost-badge__icon" />,
    labelNow: 'Frost now',
    labelSoon: (h) => `Frost ~${h}h`,
    temp: (d) => (d as FrostWindow).minTempC,
    title: (urgency, hoursUntil, temp) =>
      `${urgency === 'urgent' ? 'Frost imminent' : 'Frost alert'}: ${hoursUntil === 0 ? 'now' : `in ~${hoursUntil}h`}, low ${temp}°C. Open extreme cold guide.`,
  },
  heat: {
    activeStatus: 'heat',
    classPrefix: 'heat-badge',
    guidePath: '/beginners/extreme-heat',
    icon: <IconSun className="heat-badge__icon" />,
    labelNow: 'Heat now',
    labelSoon: (h) => `Heat ~${h}h`,
    temp: (d) => (d as HeatWindow).maxTempC,
    title: (urgency, hoursUntil, temp) =>
      `${urgency === 'urgent' ? 'Heat imminent' : 'Heat alert'}: ${hoursUntil === 0 ? 'now' : `in ~${hoursUntil}h`}, high ${temp}°C (above ${HEAT_THRESHOLD_C}°C). Open extreme heat guide.`,
  },
}

export function WeatherAlertBadge({
  variant,
  lat,
  lng,
}: {
  variant: AlertVariant
  lat: number | null
  lng: number | null
}) {
  const alert = useTemperatureAlert(variant, lat, lng)
  const config = BADGES[variant]

  if (alert.state.status !== config.activeStatus || alert.dismissed) return null

  const { hoursUntil } = alert.state.data
  const urgency = hoursUntil <= 6 ? 'urgent' : 'advance'
  const temp = config.temp(alert.state.data)
  const prefix = config.classPrefix

  return (
    <Link
      to={config.guidePath}
      className={`${prefix} ${prefix}--${urgency}`}
      role="alert"
      title={config.title(urgency, hoursUntil, temp)}
    >
      {config.icon}
      <span className={`${prefix}__label`}>
        {hoursUntil === 0 ? config.labelNow : config.labelSoon(hoursUntil)}
      </span>
      <span className={`${prefix}__temp`}>{temp}°</span>
    </Link>
  )
}
