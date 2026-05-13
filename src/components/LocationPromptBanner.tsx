import { useEffect, useState } from 'react'
import { useLocationArea } from '../context/LocationContext'
import { IconPin } from './Icons'

/**
 * Inline banner that nudges users to set a postcode/suburb before using
 * location-aware features (PlantMe recommendations, Garden Planner).
 * Hidden once the user has chosen a place (`coords` non-null). Dismissal is
 * session-scoped — the banner reappears in a new session if location is
 * still unset.
 */
const DISMISS_KEY = 'rootvio-location-prompt-dismissed-v1'

type Surface = 'plantme' | 'planner'

const COPY: Record<Surface, { title: string; body: string }> = {
  plantme: {
    title: 'Set your location for better picks',
    body: 'Recommendations are matched to your bioregion. Enter a Victorian postcode or suburb to see plants suited to your area.',
  },
  planner: {
    title: 'Set your location to plan smarter',
    body: 'The planner uses your location to suggest plants and habitat features that thrive nearby. Enter a Victorian postcode or suburb to get started.',
  },
}

export function LocationPromptBanner({ surface }: { surface: Surface }) {
  const { coords, requestOpenLocationDialog } = useLocationArea()
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  /**
   * If the user picks a location after dismissing, drop the dismiss flag so
   * the banner can reappear cleanly on a future session if they clear their
   * location again.
   */
  useEffect(() => {
    if (!coords) return
    try {
      sessionStorage.removeItem(DISMISS_KEY)
    } catch {
      /* ignore */
    }
  }, [coords])

  if (coords || dismissed) return null

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  const { title, body } = COPY[surface]

  return (
    <div
      className="location-prompt-banner"
      role="status"
      aria-live="polite"
    >
      <span className="location-prompt-banner__icon" aria-hidden>
        <IconPin />
      </span>
      <div className="location-prompt-banner__body">
        <p className="location-prompt-banner__title">{title}</p>
        <p className="location-prompt-banner__text">{body}</p>
      </div>
      <div className="location-prompt-banner__actions">
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={requestOpenLocationDialog}
        >
          Choose location
        </button>
        <button
          type="button"
          className="location-prompt-banner__dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss location prompt"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
