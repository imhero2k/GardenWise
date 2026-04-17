import { nearestAustralianRegion } from './nearestRegion'
import type { AURegionCode } from '../types/location'
import { AU_REGIONS } from '../types/location'

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'

/** https://operations.osmfoundation.org/policies/nominatim/ — identify the app */
const NOMINATIM_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Accept-Language': 'en-AU',
  'User-Agent': 'GardenWise/1.0 (https://github.com/imhero2k/GardenWise)',
}

/** Nominatim address.state values → app region codes */
const STATE_TO_CODE: Record<string, AURegionCode> = {
  Victoria: 'VIC',
  'New South Wales': 'NSW',
  Queensland: 'QLD',
  'Western Australia': 'WA',
  'South Australia': 'SA',
  Tasmania: 'TAS',
  'Northern Territory': 'NT',
  'Australian Capital Territory': 'ACT',
}

interface NominatimHit {
  lat: string
  lon: string
  display_name?: string
  address?: {
    state?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    postcode?: string
    state_district?: string
  }
}

function regionFromHit(hit: NominatimHit, lat: number, lng: number): AURegionCode {
  const state = hit.address?.state?.trim()
  if (state && STATE_TO_CODE[state]) return STATE_TO_CODE[state]
  return nearestAustralianRegion(lat, lng)
}

/** Short label for the location bar (not full display_name). */
function labelFromHit(hit: NominatimHit, regionCode: AURegionCode): string {
  const a = hit.address
  const short = AU_REGIONS[regionCode].short
  const suburb = a?.suburb || a?.town || a?.city || a?.village
  const pc = a?.postcode ? String(a.postcode).trim() : ''
  if (suburb && pc) return `${suburb} ${pc}, ${short}`
  const place = suburb || (pc || null)
  if (place) return `${place}, ${short}`
  const dn = hit.display_name
  if (dn) {
    const parts = dn.split(',').map((s) => s.trim())
    return `${parts[0]}, ${short}`
  }
  return AU_REGIONS[regionCode].label
}

export interface ReverseGeocodeAustraliaResult {
  label: string
}

/**
 * Resolve coordinates to a suburb/postcode label via Nominatim reverse.
 * Victoria-only for GardenWise — returns null if the resolved state is not VIC.
 * Use sparingly (rate limits); call after a deliberate GPS fix.
 */
export async function reverseGeocodeAustralia(
  lat: number,
  lng: number,
  options?: { signal?: AbortSignal },
): Promise<ReverseGeocodeAustraliaResult | null> {
  const url = new URL(NOMINATIM_REVERSE)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  const r = await fetch(url.toString(), {
    signal: options?.signal,
    headers: NOMINATIM_HEADERS,
  })

  if (!r.ok) return null

  const hit = (await r.json()) as NominatimHit & { error?: string }
  if (hit.error || !hit?.address) return null

  const regionCode = regionFromHit(hit, lat, lng)
  if (regionCode !== 'VIC') return null

  return { label: labelFromHit(hit, 'VIC') }
}

/** Always bias to Victoria so Nominatim prefers VIC matches (GardenWise is VIC-only). */
function buildQuery(raw: string): string {
  const t = raw.trim().replace(/\s+/g, ' ')
  if (!t) return ''
  return `${t}, ${AU_REGIONS.VIC.label}, Australia`
}

export interface GeocodeAustraliaResult {
  lat: number
  lng: number
  regionCode: AURegionCode
  label: string
}

/**
 * Resolve a postcode or suburb to coordinates via Nominatim, **Victoria only**.
 * Queries are biased to Victoria; if the best match is outside VIC, throws an Error with a clear message.
 * Use sparingly (rate limits); call from a deliberate user action (e.g. Apply).
 */
export async function geocodeAustralia(
  raw: string,
  options?: { signal?: AbortSignal },
): Promise<GeocodeAustraliaResult | null> {
  const q = buildQuery(raw)
  if (!q) return null

  const url = new URL(NOMINATIM)
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 'au')

  const r = await fetch(url.toString(), {
    signal: options?.signal,
    headers: NOMINATIM_HEADERS,
  })

  if (!r.ok) throw new Error(`Look-up failed (${r.status})`)

  const data = (await r.json()) as NominatimHit[]
  const hit = data[0]
  if (!hit?.lat || !hit?.lon) return null

  const lat = Number.parseFloat(hit.lat)
  const lng = Number.parseFloat(hit.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const regionCode = regionFromHit(hit, lat, lng)
  if (regionCode !== 'VIC') {
    throw new Error(
      'That location is not in Victoria. GardenWise only supports Victorian suburbs and postcodes.',
    )
  }

  const label = labelFromHit(hit, 'VIC')
  return { lat, lng, regionCode: 'VIC', label }
}
