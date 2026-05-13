/** Row shape in `vic-nurseries.json`. */
export interface VicNurseryJsonRow {
  id: string
  name: string
  lat: number
  lng: number
  kind: 'nursery' | 'public_garden'
  folder: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: string | null
}
