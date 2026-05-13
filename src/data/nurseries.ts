import type { Nursery } from '../types/plant'
import type { VicNurseryJsonRow } from './vic-nurseries.types'
import vicNurseriesJson from './vic-nurseries.json'

function rowToNursery(r: VicNurseryJsonRow): Nursery {
  return {
    id: r.id,
    name: r.name,
    lat: r.lat,
    lng: r.lng,
    kind: r.kind,
    address: r.address ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    website: r.website ?? undefined,
    openingHours: r.opening_hours ?? undefined,
  }
}

/** Victorian native nurseries & public gardens (APS Vic My Maps layer, exported as KML → JSON). */
export const nurseries: Nursery[] = (vicNurseriesJson as VicNurseryJsonRow[]).map(rowToNursery)
