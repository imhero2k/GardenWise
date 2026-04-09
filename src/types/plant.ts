export type RiskLevel = 'Low' | 'Medium' | 'High'

export interface Plant {
  id: string
  name: string
  scientificName: string
  image: string
  invasiveRisk: RiskLevel
  sunlight: string
  water: string
  soilPh: string
  companionsGood: string[]
  companionsBad: string[]
  seasonalNote: string
  seasons: string[]
  tags: string[]
}

export interface GardenPlant extends Plant {
  health: 'Thriving' | 'Good' | 'Needs care'
  waterDue: string
}

export type NurseryKind = 'nursery' | 'public_garden'

export interface Nursery {
  id: string
  name: string
  /** WGS84 latitude (decimal degrees) */
  lat: number
  /** WGS84 longitude (decimal degrees) */
  lng: number
  kind: NurseryKind
  /** Raw layer description (may include line breaks as HTML) */
  description?: string | null
  /** URLs parsed from the layer description */
  websites?: string[]
  address?: string
  phone?: string
  rating?: number
  organic?: boolean
  lowInvasiveFocus?: boolean
}

export interface CommunityPost {
  id: string
  image: string
  author: string
  location: string
  likes: number
  comments: number
}
