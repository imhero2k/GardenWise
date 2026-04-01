import type { AURegionCode } from '../types/location'

/** Approximate geographic centres for nearest-state inference (gardening use, not legal boundaries). */
export const AU_CENTROIDS: { code: AURegionCode; lat: number; lng: number }[] = [
  { code: 'WA', lat: -25.5, lng: 121.5 },
  { code: 'NT', lat: -19.5, lng: 133.5 },
  { code: 'SA', lat: -30.5, lng: 135.5 },
  { code: 'QLD', lat: -22.0, lng: 144.5 },
  { code: 'NSW', lat: -32.0, lng: 147.0 },
  { code: 'ACT', lat: -35.3, lng: 149.1 },
  { code: 'VIC', lat: -37.0, lng: 145.5 },
  { code: 'TAS', lat: -42.0, lng: 146.5 },
]

export function nearestAustralianRegion(lat: number, lng: number): AURegionCode {
  let best: AURegionCode = 'NSW'
  let bestD = Infinity
  for (const c of AU_CENTROIDS) {
    const d = (lat - c.lat) ** 2 + (lng - c.lng) ** 2
    if (d < bestD) {
      bestD = d
      best = c.code
    }
  }
  return best
}

/** Rough sanity check for coordinates likely in Australia / nearby maritime. */
export function isLikelyAustraliaRegion(lat: number, lng: number): boolean {
  return lat <= -9 && lat >= -45 && lng >= 110 && lng <= 155
}

export function getRegionCentroid(code: AURegionCode): { lat: number; lng: number } {
  const row = AU_CENTROIDS.find((c) => c.code === code)
  return row ? { lat: row.lat, lng: row.lng } : { lat: -27.5, lng: 133.0 }
}
