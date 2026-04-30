import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { reverseGeocodeAustralia } from '../lib/geocodeAu'
import { isLikelyAustraliaRegion, nearestAustralianRegion } from '../lib/nearestRegion'
import type { AURegionCode, GeoCoords, StoredLocationV1 } from '../types/location'
import { AU_REGIONS } from '../types/location'

const STORAGE_KEY = 'gardenwise-location-v1'

function loadStored(): StoredLocationV1 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredLocationV1
    if (parsed?.v !== 1 || !parsed.regionCode || !AU_REGIONS[parsed.regionCode]) return null
    if (parsed.regionCode !== 'VIC') return null
    const src = parsed.source
    if (src !== 'manual' && src !== 'gps' && src !== 'place') return null
    return parsed
  } catch {
    return null
  }
}

function saveStored(data: StoredLocationV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

interface LocationContextValue {
  regionCode: AURegionCode | null
  source: 'manual' | 'gps' | 'place' | null
  coords: GeoCoords | null
  /** Suburb/postcode label from place look-up or reverse geocode after GPS */
  placeLabel: string | null
  geoError: string | null
  isDetecting: boolean
  /** Primary line for UI, e.g. suburb label or "Near you · Victoria" */
  areaLabel: string
  /** Short badge, e.g. "VIC" */
  areaShort: string
  /** Postcode or suburb resolved via geocoder; sets region + coords for local tips / bioregion */
  setLocationFromPlace: (regionCode: AURegionCode, coords: GeoCoords, placeLabel: string) => void
  requestGeolocation: () => void
  clearGeoError: () => void
  /** Open the location dialog (e.g. after sign-in). Works even before LocationBar mounts. */
  requestOpenLocationDialog: () => void
  locationDialogRequestPending: boolean
  acknowledgeLocationDialogRequest: () => void
}

const LocationContext = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const initial = loadStored()
  const [regionCode, setRegionCode] = useState<AURegionCode | null>(
    initial?.regionCode ?? null,
  )
  const [source, setSource] = useState<'manual' | 'gps' | 'place' | null>(initial?.source ?? null)
  const [coords, setCoords] = useState<GeoCoords | null>(initial?.coords ?? null)
  const [placeLabel, setPlaceLabel] = useState<string | null>(initial?.placeLabel ?? null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [locationDialogRequestPending, setLocationDialogRequestPending] = useState(false)
  const reverseGeocodeGeneration = useRef(0)

  const persist = useCallback(
    (next: {
      source: 'manual' | 'gps' | 'place'
      regionCode: AURegionCode
      coords?: GeoCoords | null
      placeLabel?: string | null
    }) => {
      const payload: StoredLocationV1 = {
        v: 1,
        source: next.source,
        regionCode: next.regionCode,
        updatedAt: Date.now(),
      }
      if (next.coords) payload.coords = next.coords
      if (next.placeLabel && (next.source === 'place' || next.source === 'gps')) {
        payload.placeLabel = next.placeLabel
      }
      saveStored(payload)
    },
    [],
  )

  const setLocationFromPlace = useCallback(
    (code: AURegionCode, nextCoords: GeoCoords, label: string) => {
      setRegionCode(code)
      setSource('place')
      setCoords(nextCoords)
      setPlaceLabel(label)
      setGeoError(null)
      persist({ source: 'place', regionCode: code, coords: nextCoords, placeLabel: label })
    },
    [persist],
  )

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Location is not supported in this browser.')
      return
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setGeoError(
        'Location needs a secure site (https). Open the app over HTTPS or use localhost for testing.',
      )
      return
    }

    setGeoError(null)
    setIsDetecting(true)

    const finishError = (err: GeolocationPositionError) => {
      setIsDetecting(false)
      // 1 = denied, 2 = unavailable, 3 = timeout (GeolocationPositionError codes)
      if (err.code === 1) {
        setGeoError(
          'Location access was denied. Allow location for this site in your browser settings, or enter a Victorian postcode or suburb.',
        )
      } else if (err.code === 3) {
        setGeoError(
          'Location timed out. Try again (Wi‑Fi often helps on laptops), or enter a Victorian postcode or suburb.',
        )
      } else if (err.code === 2) {
        setGeoError(
          'Your device couldn’t get a fix (common indoors, on VPN, or with desktop browsers). Enter a Victorian postcode or suburb, or try again near a window with location allowed.',
        )
      } else {
        setGeoError(
          'Could not read your location. Enter a Victorian postcode or suburb, or try again in a moment.',
        )
      }
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      if (!isLikelyAustraliaRegion(lat, lng)) {
        setGeoError(
          'Detected position looks outside Australia. Enter a Victorian postcode or suburb instead.',
        )
        setIsDetecting(false)
        return
      }
      const inferred = nearestAustralianRegion(lat, lng)
      if (inferred !== 'VIC') {
        setGeoError(
          'GardenWise is Victoria-only. Your location appears to be outside Victoria. Enter a Victorian postcode or suburb instead.',
        )
        setIsDetecting(false)
        return
      }
      const nextCoords: GeoCoords = {
        lat,
        lng,
        accuracy: pos.coords.accuracy,
      }
      setRegionCode(inferred)
      setSource('gps')
      setCoords(nextCoords)
      setPlaceLabel(null)
      persist({ source: 'gps', regionCode: inferred, coords: nextCoords })
      setIsDetecting(false)

      const gen = ++reverseGeocodeGeneration.current
      void reverseGeocodeAustralia(lat, lng)
        .then((rev) => {
          if (reverseGeocodeGeneration.current !== gen || !rev) return
          setPlaceLabel(rev.label)
          persist({
            source: 'gps',
            regionCode: inferred,
            coords: nextCoords,
            placeLabel: rev.label,
          })
        })
        .catch(() => {
          /* optional; keep "Near you" style label until next fix */
        })
    }

    // 1) Fast / Wi‑Fi–style fix (often enough for the permission prompt + a reading)
    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(onSuccess, tryHighAccuracy, {
        enableHighAccuracy: false,
        timeout: 22_000,
        maximumAge: 60_000,
      })
    }

    // 2) GPS / finer fix (helps phones; some laptops after Allow)
    const tryHighAccuracy = () => {
      navigator.geolocation.getCurrentPosition(onSuccess, tryStale, {
        enableHighAccuracy: true,
        timeout: 18_000,
        maximumAge: 0,
      })
    }

    // 3) Any cached position (Safari / desktop after user allowed before)
    const tryStale = () => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (lastErr) => finishError(lastErr),
        {
          enableHighAccuracy: false,
          timeout: 12_000,
          maximumAge: Infinity,
        },
      )
    }

    tryLowAccuracy()
  }, [persist])

  const clearGeoError = useCallback(() => setGeoError(null), [])

  const requestOpenLocationDialog = useCallback(() => {
    setLocationDialogRequestPending(true)
  }, [])

  const acknowledgeLocationDialogRequest = useCallback(() => {
    setLocationDialogRequestPending(false)
  }, [])

  const { areaLabel, areaShort } = useMemo(() => {
    if (!regionCode) {
      return { areaLabel: 'Victoria', areaShort: 'VIC' }
    }
    const r = AU_REGIONS[regionCode]
    if (source === 'gps' && coords && placeLabel) {
      return { areaLabel: placeLabel, areaShort: r.short }
    }
    if (source === 'gps' && coords) {
      return {
        areaLabel: `Near you · ${r.label}`,
        areaShort: r.short,
      }
    }
    if (source === 'place' && coords && placeLabel) {
      return {
        areaLabel: placeLabel,
        areaShort: r.short,
      }
    }
    return { areaLabel: r.label, areaShort: r.short }
  }, [regionCode, source, coords, placeLabel])

  const value = useMemo<LocationContextValue>(
    () => ({
      regionCode,
      source,
      coords,
      placeLabel,
      geoError,
      isDetecting,
      areaLabel,
      areaShort,
      setLocationFromPlace,
      requestGeolocation,
      clearGeoError,
      requestOpenLocationDialog,
      locationDialogRequestPending,
      acknowledgeLocationDialogRequest,
    }),
    [
      regionCode,
      source,
      coords,
      placeLabel,
      geoError,
      isDetecting,
      areaLabel,
      areaShort,
      setLocationFromPlace,
      requestGeolocation,
      clearGeoError,
      requestOpenLocationDialog,
      locationDialogRequestPending,
      acknowledgeLocationDialogRequest,
    ],
  )

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  )
}

export function useLocationArea() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocationArea must be used within LocationProvider')
  return ctx
}
