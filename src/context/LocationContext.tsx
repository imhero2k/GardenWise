import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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
  source: 'manual' | 'gps' | null
  coords: GeoCoords | null
  geoError: string | null
  isDetecting: boolean
  /** Primary line for UI, e.g. "Queensland" or "Near you · Queensland" */
  areaLabel: string
  /** Short badge, e.g. "QLD" */
  areaShort: string
  setManualRegion: (code: AURegionCode) => void
  requestGeolocation: () => void
  clearGeoError: () => void
}

const LocationContext = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const initial = loadStored()
  const [regionCode, setRegionCode] = useState<AURegionCode | null>(
    initial?.regionCode ?? null,
  )
  const [source, setSource] = useState<'manual' | 'gps' | null>(initial?.source ?? null)
  const [coords, setCoords] = useState<GeoCoords | null>(initial?.coords ?? null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const persist = useCallback(
    (next: { source: 'manual' | 'gps'; regionCode: AURegionCode; coords?: GeoCoords | null }) => {
      const payload: StoredLocationV1 = {
        v: 1,
        source: next.source,
        regionCode: next.regionCode,
        updatedAt: Date.now(),
      }
      if (next.coords) payload.coords = next.coords
      saveStored(payload)
    },
    [],
  )

  const setManualRegion = useCallback(
    (code: AURegionCode) => {
      setRegionCode(code)
      setSource('manual')
      setCoords(null)
      setGeoError(null)
      persist({ source: 'manual', regionCode: code, coords: null })
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
          'Location access was denied. Allow location for this site in your browser settings, or pick your state below.',
        )
      } else if (err.code === 3) {
        setGeoError(
          'Location timed out. Try again (Wi‑Fi often helps on laptops), or pick your state below.',
        )
      } else if (err.code === 2) {
        setGeoError(
          'Your device couldn’t get a fix (common indoors, on VPN, or with desktop browsers). Pick your state below, or try again near a window with location allowed.',
        )
      } else {
        setGeoError(
          'Could not read your location. Pick your state below, or try again in a moment.',
        )
      }
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      if (!isLikelyAustraliaRegion(lat, lng)) {
        setGeoError(
          'Detected position looks outside Australia. Pick your state manually instead.',
        )
        setIsDetecting(false)
        return
      }
      const inferred = nearestAustralianRegion(lat, lng)
      const nextCoords: GeoCoords = {
        lat,
        lng,
        accuracy: pos.coords.accuracy,
      }
      setRegionCode(inferred)
      setSource('gps')
      setCoords(nextCoords)
      persist({ source: 'gps', regionCode: inferred, coords: nextCoords })
      setIsDetecting(false)
    }

    // Prefer a fresh-ish reading; if that fails, one retry with any cached position (helps Safari/desktop).
    const tryFresh = () => {
      navigator.geolocation.getCurrentPosition(onSuccess, tryStale, {
        enableHighAccuracy: false,
        timeout: 18_000,
        maximumAge: 60_000,
      })
    }

    const tryStale = (_firstErr: GeolocationPositionError) => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (secondErr) => finishError(secondErr),
        {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: Infinity,
        },
      )
    }

    tryFresh()
  }, [persist])

  const clearGeoError = useCallback(() => setGeoError(null), [])

  const { areaLabel, areaShort } = useMemo(() => {
    if (!regionCode) {
      return { areaLabel: 'Australia', areaShort: 'AU' }
    }
    const r = AU_REGIONS[regionCode]
    if (source === 'gps' && coords) {
      return {
        areaLabel: `Near you · ${r.label}`,
        areaShort: r.short,
      }
    }
    return { areaLabel: r.label, areaShort: r.short }
  }, [regionCode, source, coords])

  const value = useMemo<LocationContextValue>(
    () => ({
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
    }),
    [
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
