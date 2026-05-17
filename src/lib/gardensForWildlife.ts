import g4wData from '../data/vic-gardens-for-wildlife.json'

export const GARDENS_FOR_WILDLIFE_VIC_URL = 'https://gardensforwildlifevictoria.com'

type CouncilEntry = {
  has_g4w_program: boolean
  g4w_url: string | null
}

type VicGardensForWildlifeData = {
  councils: Record<string, CouncilEntry>
  suburbs: Record<string, string>
}

const data = g4wData as VicGardensForWildlifeData

const suburbToCouncil = new Map<string, string>()
for (const [suburb, council] of Object.entries(data.suburbs)) {
  suburbToCouncil.set(normalizeKey(suburb), council)
}

function normalizeKey(s: string): string {
  return s.trim().toLowerCase()
}

/** First locality from location bar label, e.g. "Carlton 3053, VIC" → "Carlton". */
export function parseSuburbFromPlaceLabel(placeLabel: string | null): string | null {
  if (!placeLabel?.trim()) return null
  const head = placeLabel.split(',')[0]?.trim() ?? ''
  const withoutPostcode = head.replace(/\s+\d{4}\s*$/, '').trim()
  return withoutPostcode || null
}

export type GardensForWildlifeInfo =
  | { kind: 'vic-only'; vicUrl: string }
  | {
      kind: 'local'
      vicUrl: string
      councilName: string
      councilUrl: string
      suburbLabel: string
    }

export function getGardensForWildlifeInfo(placeLabel: string | null): GardensForWildlifeInfo {
  const vicUrl = GARDENS_FOR_WILDLIFE_VIC_URL
  const suburbLabel = parseSuburbFromPlaceLabel(placeLabel)
  if (!suburbLabel) return { kind: 'vic-only', vicUrl }

  const councilName = suburbToCouncil.get(normalizeKey(suburbLabel))
  if (!councilName) return { kind: 'vic-only', vicUrl }

  const council = data.councils[councilName]
  if (!council?.has_g4w_program) return { kind: 'vic-only', vicUrl }

  const councilUrl = typeof council.g4w_url === 'string' ? council.g4w_url.trim() : ''
  if (!councilUrl) return { kind: 'vic-only', vicUrl }

  return { kind: 'local', vicUrl, councilName, councilUrl, suburbLabel }
}
