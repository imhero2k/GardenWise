import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocationArea } from '../context/LocationContext'
import { useWeather } from '../hooks/useWeather'
import { geocodeAustralia } from '../lib/geocodeAu'
import { getRegionCentroid } from '../lib/nearestRegion'
import { IconPin } from './Icons'
import { WeatherMini } from './WeatherMini'

const SOFT_DISMISS_KEY = 'gardenwise-location-soft-dismiss-v1'

function readSoftDismissed(): boolean {
  try {
    return localStorage.getItem(SOFT_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function LocationBar() {
  const {
    regionCode,
    source,
    coords,
    geoError,
    isDetecting,
    areaLabel,
    areaShort,
    setLocationFromPlace,
    requestGeolocation,
    clearGeoError,
    locationDialogRequestPending,
    acknowledgeLocationDialogRequest,
  } = useLocationArea()

  const { lat: weatherLat, lng: weatherLng } = useMemo(() => {
    if (!regionCode) return { lat: null as number | null, lng: null as number | null }
    if (coords) return { lat: coords.lat, lng: coords.lng }
    const c = getRegionCentroid(regionCode)
    return { lat: c.lat, lng: c.lng }
  }, [regionCode, coords])

  const weatherState = useWeather(weatherLat, weatherLng)

  const [softDismissed, setSoftDismissed] = useState(readSoftDismissed)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const prevDetecting = useRef(false)
  const placeInputId = useId()
  const titleId = useId()

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeLoading, setPlaceLoading] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)

  const openDialog = useCallback(() => {
    clearGeoError()
    setPlaceError(null)
    dialogRef.current?.showModal()
  }, [clearGeoError])

  const closeDialog = () => {
    dialogRef.current?.close()
  }

  const handleLater = () => {
    try {
      localStorage.setItem(SOFT_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setSoftDismissed(true)
  }

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const onClose = () => clearGeoError()
    d.addEventListener('close', onClose)
    return () => d.removeEventListener('close', onClose)
  }, [clearGeoError])

  useEffect(() => {
    if (!locationDialogRequestPending) return
    openDialog()
    acknowledgeLocationDialogRequest()
  }, [locationDialogRequestPending, openDialog, acknowledgeLocationDialogRequest])

  useEffect(() => {
    if (prevDetecting.current && !isDetecting && !geoError && source === 'gps') {
      dialogRef.current?.close()
    }
    prevDetecting.current = isDetecting
  }, [isDetecting, geoError, source])

  const applyPostcodeOrSuburb = async () => {
    const q = placeQuery.trim()
    if (q.length < 2) {
      setPlaceError('Enter at least 2 characters (e.g. postcode or suburb).')
      return
    }
    setPlaceLoading(true)
    setPlaceError(null)
    try {
      const result = await geocodeAustralia(q)
      if (!result) {
        setPlaceError(
          'No match found in Victoria. Try a Victorian postcode or suburb (e.g. 3000 or Carlton).',
        )
        return
      }
      setLocationFromPlace(
        result.regionCode,
        { lat: result.lat, lng: result.lng },
        result.label,
      )
      setPlaceQuery('')
      closeDialog()
    } catch (e) {
      setPlaceError(e instanceof Error ? e.message : 'Look-up failed')
    } finally {
      setPlaceLoading(false)
    }
  }

  const showNudge = !regionCode && !softDismissed

  return (
    <>
      <div className="location-bar" role="region" aria-label="Local area">
        <div className="location-bar__row">
          <span className="location-bar__icon" aria-hidden>
            <IconPin className="location-bar__pin-svg" />
          </span>

          {regionCode ? (
            <span className="location-bar__summary" title={areaLabel}>
              <span className="location-bar__badge">{areaShort}</span>
              <span className="location-bar__truncate">{areaLabel}</span>
            </span>
          ) : showNudge ? (
            <span className="location-bar__hint">Set once for local tips</span>
          ) : (
            <span className="location-bar__hint location-bar__hint--muted">Area not set</span>
          )}

          {regionCode ? (
            <div className="location-bar__weather-wrap">
              <WeatherMini state={weatherState} />
            </div>
          ) : null}

          <span className="location-bar__actions">
            {regionCode ? (
              <button type="button" className="location-bar__link" onClick={openDialog}>
                Change
              </button>
            ) : showNudge ? (
              <>
                <button type="button" className="location-bar__link location-bar__link--emph" onClick={openDialog}>
                  Set
                </button>
                <button type="button" className="location-bar__link" onClick={handleLater}>
                  Later
                </button>
              </>
            ) : (
              <button type="button" className="location-bar__link location-bar__link--emph" onClick={openDialog}>
                Set area
              </button>
            )}
          </span>
        </div>
      </div>

      <dialog ref={dialogRef} className="location-dialog" aria-labelledby={titleId}>
        <div className="location-dialog__inner">
          <h2 id={titleId} className="location-dialog__title">
            Local area
          </h2>
          <p className="location-dialog__hint">
            GardenWise covers <strong>Victoria only</strong>. Enter a Victorian postcode or suburb, or use browser
            location once. We use this for tips and nearby ideas — not for ads.
          </p>

          <div className="location-dialog__field">
            <label htmlFor={placeInputId}>Postcode or suburb</label>
            <input
              id={placeInputId}
              type="text"
              className="location-dialog__input"
              placeholder="e.g. 3000 or Carlton"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
              autoComplete="postal-code"
              disabled={placeLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void applyPostcodeOrSuburb()
                }
              }}
            />
            <p className="location-dialog__hint" style={{ margin: '0.25rem 0 0', fontSize: '0.78rem' }}>
              Look-up is biased to Victoria. Data from{' '}
              <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer">
                OpenStreetMap Nominatim
              </a>
              .
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              style={{ marginTop: 'var(--space-sm)' }}
              disabled={placeLoading}
              onClick={() => void applyPostcodeOrSuburb()}
            >
              {placeLoading ? 'Looking up…' : 'Use this postcode / suburb'}
            </button>
            {placeError && (
              <p className="location-dialog__error" role="alert" style={{ marginTop: 'var(--space-sm)' }}>
                {placeError}
              </p>
            )}
          </div>

          <div className="location-dialog__or">or</div>

          <p className="location-dialog__permission-hint" role="note">
            When you tap the button below, your browser should show a <strong>location permission</strong>{' '}
            pop-up — choose <strong>Allow</strong> (once). If nothing appears, open the lock/site icon in
            the address bar and set location to <strong>Allow</strong> for this site (it may have been
            blocked earlier).
          </p>

          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={isDetecting}
            onClick={(e) => {
              e.preventDefault()
              clearGeoError()
              requestGeolocation()
            }}
          >
            {isDetecting ? 'Waiting for location…' : 'Allow location in browser'}
          </button>

          {geoError && (
            <p className="location-dialog__error" role="alert">
              {geoError}
            </p>
          )}

          <div className="location-dialog__actions">
            <button type="button" className="btn btn-secondary btn-block" onClick={closeDialog}>
              Done
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
