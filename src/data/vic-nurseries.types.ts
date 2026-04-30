/** Row shape in `vic-nurseries.json` (from Google My Maps KML). */
export interface VicNurseryJsonRow {
  id: string
  name: string
  lat: number
  lng: number
  kind: 'nursery' | 'public_garden'
  folder: string
  description: string | null
  websites: string[]
  phone: string | null
}
