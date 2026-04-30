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
    description: r.description,
    websites: r.websites.length > 0 ? r.websites : undefined,
    phone: r.phone ?? undefined,
  }
}

/** Victorian native nurseries & public gardens (APS Vic My Maps layer, exported as KML → JSON). */
export const nurseries: Nursery[] = (vicNurseriesJson as VicNurseryJsonRow[]).map(rowToNursery)
