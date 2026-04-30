/**
 * Single-plant detail fetcher used by the "View details" modal. Currently surfaces
 * `wildlifeAttracted` derived from `plant_trait` on the backend; extend with more fields
 * as additional traits become useful in the UI.
 */

export type WildlifeGroup = {
  type: string
  species: string[]
}

export type PlantDetail = {
  id: string
  scientificName: string
  commonName: string | null
  wildlifeAttracted: WildlifeGroup[]
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

/**
 * Fetch a plant by its database id. Returns null on 404 (caller hides the section
 * gracefully) and throws on transport / 5xx errors so the UI can surface them.
 */
export async function fetchPlantDetail(
  id: string | number,
  signal?: AbortSignal,
): Promise<PlantDetail | null> {
  const base = apiBase()
  const path = `/api/plants/${encodeURIComponent(String(id))}`
  const url = base ? `${base}${path}` : path
  const r = await fetch(url, { signal })
  if (r.status === 404) return null
  if (!r.ok) {
    let msg = `Request failed (${r.status})`
    try {
      const j = (await r.json()) as { error?: string }
      if (j.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const j = (await r.json()) as Partial<PlantDetail>
  return {
    id: String(j.id ?? id),
    scientificName: j.scientificName ?? '',
    commonName: j.commonName ?? null,
    wildlifeAttracted: Array.isArray(j.wildlifeAttracted) ? j.wildlifeAttracted : [],
  }
}
