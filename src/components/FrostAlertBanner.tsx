import { useMemo } from 'react'
import { useLocationArea } from '../context/LocationContext'
import { useFrostAlert } from '../hooks/useFrostAlert'
import { getRegionCentroid } from '../lib/nearestRegion'
import { IconFrost } from './Icons'

export function FrostAlertBanner() {
  const { regionCode, coords } = useLocationArea()

  const { lat, lng } = useMemo(() => {
    if (!regionCode) return { lat: null as number | null, lng: null as number | null }
    if (coords) return { lat: coords.lat, lng: coords.lng }
    const c = getRegionCentroid(regionCode)
    return { lat: c.lat, lng: c.lng }
  }, [regionCode, coords])

  const frost = useFrostAlert(lat, lng)

  if (frost.state.status !== 'frost' || frost.dismissed) return null

  const { minTempC, hoursUntil, startsAt } = frost.state.data
  const urgency = hoursUntil <= 6 ? 'urgent' : 'advance'

  let timeStr = ''
  try {
    timeStr = new Date(startsAt).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch { /* ignore */ }

  const detail =
    hoursUntil === 0
      ? `Frost conditions now — low of ${minTempC}°C.`
      : `Expected in ~${hoursUntil}h${timeStr ? ` (around ${timeStr})` : ''} — low of ${minTempC}°C.`

  return (
    <div
      className={`frost-banner frost-banner--${urgency}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="frost-banner__inner">
        <IconFrost className="frost-banner__icon" />
        <span className="frost-banner__text">
          <strong>{urgency === 'urgent' ? 'Frost imminent!' : 'Frost alert'}</strong>
          {' · '}
          {detail} Cover sensitive plants and bring pots indoors.
        </span>
        <button
          type="button"
          className="frost-banner__dismiss"
          onClick={frost.dismiss}
          aria-label="Dismiss frost alert"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
