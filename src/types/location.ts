export type AURegionCode = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'NT' | 'ACT'

export const AU_REGIONS: Record<
  AURegionCode,
  { label: string; short: string }
> = {
  NSW: { label: 'New South Wales', short: 'NSW' },
  VIC: { label: 'Victoria', short: 'VIC' },
  QLD: { label: 'Queensland', short: 'QLD' },
  WA: { label: 'Western Australia', short: 'WA' },
  SA: { label: 'South Australia', short: 'SA' },
  TAS: { label: 'Tasmania', short: 'TAS' },
  NT: { label: 'Northern Territory', short: 'NT' },
  ACT: { label: 'Australian Capital Territory', short: 'ACT' },
}

export const AU_REGION_LIST: AURegionCode[] = [
  'NSW',
  'VIC',
  'QLD',
  'WA',
  'SA',
  'TAS',
  'NT',
  'ACT',
]

export interface GeoCoords {
  lat: number
  lng: number
  accuracy?: number
}

export interface StoredLocationV1 {
  v: 1
  source: 'manual' | 'gps'
  regionCode: AURegionCode
  coords?: GeoCoords
  updatedAt: number
}
