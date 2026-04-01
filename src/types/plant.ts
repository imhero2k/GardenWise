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

export interface Nursery {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  phone: string
  rating: number
  organic: boolean
  lowInvasiveFocus: boolean
}

export interface CommunityPost {
  id: string
  image: string
  author: string
  location: string
  likes: number
  comments: number
}
