import { useMemo } from 'react'
import { useLocationArea } from '../context/LocationContext'
import { getRegionCentroid } from '../lib/nearestRegion'

/** Lat/lng for weather alerts: GPS when available, else bioregion centroid. */
export function useWeatherCoords() {
  const { regionCode, coords } = useLocationArea()

  return useMemo(() => {
    if (!regionCode) return { lat: null as number | null, lng: null as number | null }
    if (coords) return { lat: coords.lat, lng: coords.lng }
    const c = getRegionCentroid(regionCode)
    return { lat: c.lat, lng: c.lng }
  }, [regionCode, coords])
}
