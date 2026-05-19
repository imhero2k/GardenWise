import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTemperatureAlert } from '../hooks/useTemperatureAlert'
import { useWeatherCoords } from '../hooks/useWeatherCoords'
import { HEAT_THRESHOLD_C, type FrostWindow, type HeatWindow } from '../lib/weather'
import { IconFrost, IconSun } from './Icons'

type AlertVariant = 'frost' | 'heat'

type VariantConfig = {
  activeStatus: 'frost' | 'heat'
  bannerClass: string
  guidePath: string
  guideLabel: string
  dismissLabel: string
  icon: ReactNode
  urgentTitle: string
  advanceTitle: string
  detail: (data: FrostWindow | HeatWindow, hoursUntil: number, timeStr: string) => string
}

const VARIANTS: Record<AlertVariant, VariantConfig> = {
  frost: {
    activeStatus: 'frost',
    bannerClass: 'frost-banner',
    guidePath: '/beginners/extreme-cold',
    guideLabel: 'extreme cold guide',
    dismissLabel: 'Dismiss frost alert',
    icon: <IconFrost className="frost-banner__icon" />,
    urgentTitle: 'Frost imminent!',
    advanceTitle: 'Frost alert',
    detail: (data, hoursUntil, timeStr) => {
      const { minTempC } = data as FrostWindow
      return hoursUntil === 0
        ? `Frost conditions now — low of ${minTempC}°C.`
        : `Expected in ~${hoursUntil}h${timeStr ? ` (around ${timeStr})` : ''} — low of ${minTempC}°C.`
    },
  },
  heat: {
    activeStatus: 'heat',
    bannerClass: 'heat-banner',
    guidePath: '/beginners/extreme-heat',
    guideLabel: 'extreme heat guide',
    dismissLabel: 'Dismiss heat alert',
    icon: <IconSun className="heat-banner__icon" />,
    urgentTitle: 'Heat imminent!',
    advanceTitle: 'Heat alert',
    detail: (data, hoursUntil, timeStr) => {
      const { maxTempC } = data as HeatWindow
      const threshold = `above ${HEAT_THRESHOLD_C}°C`
      return hoursUntil === 0
        ? `Heat stress now — high of ${maxTempC}°C (${threshold}).`
        : `Expected in ~${hoursUntil}h${timeStr ? ` (around ${timeStr})` : ''} — high of ${maxTempC}°C (${threshold}).`
    },
  },
}

function formatStartTime(startsAt: string) {
  try {
    return new Date(startsAt).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return ''
  }
}

export function WeatherAlertBanner({ variant }: { variant: AlertVariant }) {
  const { lat, lng } = useWeatherCoords()
  const alert = useTemperatureAlert(variant, lat, lng)
  const config = VARIANTS[variant]

  if (alert.state.status !== config.activeStatus || alert.dismissed) return null

  const { hoursUntil, startsAt } = alert.state.data
  const urgency = hoursUntil <= 6 ? 'urgent' : 'advance'
  const timeStr = formatStartTime(startsAt)
  const detail = config.detail(alert.state.data, hoursUntil, timeStr)
  const prefix = config.bannerClass

  return (
    <div
      className={`${prefix} ${prefix}--${urgency}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`${prefix}__inner`}>
        <Link to={config.guidePath} className={`${prefix}__link`}>
          {config.icon}
          <span className={`${prefix}__text`}>
            <strong>{urgency === 'urgent' ? config.urgentTitle : config.advanceTitle}</strong>
            {' · '}
            {detail} See the{' '}
            <span className={`${prefix}__guide`}>{config.guideLabel}</span> for tips.
          </span>
        </Link>
        <button
          type="button"
          className={`${prefix}__dismiss`}
          onClick={alert.dismiss}
          aria-label={config.dismissLabel}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
