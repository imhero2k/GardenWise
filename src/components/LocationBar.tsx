import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useLocationArea } from '../context/LocationContext'
import { useWeather } from '../hooks/useWeather'
import { getRegionCentroid } from '../lib/nearestRegion'
import { AU_REGION_LIST, AU_REGIONS, type AURegionCode } from '../types/location'
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
    setManualRegion,
    requestGeolocation,
    clearGeoError,
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
  const selectId = useId()
  const titleId = useId()

  const openDialog = () => {
    clearGeoError()
    dialogRef.current?.showModal()
  }

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
    if (prevDetecting.current && !isDetecting && !geoError && source === 'gps') {
      dialogRef.current?.close()
    }
    prevDetecting.current = isDetecting
  }, [isDetecting, geoError, source])

  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as AURegionCode
    setManualRegion(v)
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
              <span className="location-bar__truncate">
                {source === 'gps' ? 'Near you' : AU_REGIONS[regionCode].label}
              </span>
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
            Pick your state, or detect once. We use this for tips and nearby ideas — not for ads.
          </p>

          <div className="location-dialog__field">
            <label htmlFor={selectId}>State or territory</label>
            <select
              id={selectId}
              className="location-dialog__select"
              value={regionCode ?? ''}
              onChange={onSelectChange}
            >
              <option value="" disabled>
                Select…
              </option>
              {AU_REGION_LIST.map((code) => (
                <option key={code} value={code}>
                  {AU_REGIONS[code].label}
                </option>
              ))}
            </select>
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
