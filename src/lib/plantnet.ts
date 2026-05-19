import type { PredictResponse } from './predict'

type PlantNetIdentifyResult = {
  score?: number
  species?: {
    scientificNameWithoutAuthor?: string
    scientificName?: string
    commonNames?: string[]
  }
}

type PlantNetIdentifyResponse = {
  results?: PlantNetIdentifyResult[]
  bestMatch?: string
}

/** Pl@ntNet Identify v2 — browser calls with CORS (key must be “exposed” + domain allowlisted in Pl@ntNet). */
const PLANTNET_IDENTIFY_URL = 'https://my-api.plantnet.org/v2/identify/all'

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

function serverProxyUrl(): string {
  const b = apiBase()
  return b ? `${b}/api/plantnet/identify` : '/api/plantnet/identify'
}

function getPlantNetApiKey(): string | null {
  const k = import.meta.env.VITE_PLANTNET_API_KEY
  if (typeof k === 'string' && k.trim()) return k.trim()
  return null
}

function stripDataUrlToBase64(dataUrl: string): string {
  const s = String(dataUrl ?? '').trim()
  if (s.startsWith('data:')) return (s.split(',', 2)[1] ?? '').replace(/\s+/g, '').trim()
  return s.replace(/\s+/g, '').trim()
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(',', 2)
  if (!meta || !data) throw new Error('Invalid image data URL')
  const contentType = meta.match(/^data:([^;]+);base64$/i)?.[1] ?? 'image/jpeg'
  const bytes = atob(data)
  const out = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) out[i] = bytes.charCodeAt(i)
  return new Blob([out], { type: contentType })
}

function mapPlantNetResponse(json: PlantNetIdentifyResponse): PredictResponse | null {
  const best = Array.isArray(json.results) && json.results.length > 0 ? json.results[0] : null
  let label =
    best?.species?.scientificNameWithoutAuthor?.trim() ||
    best?.species?.scientificName?.trim() ||
    ''
  if (!label && typeof json.bestMatch === 'string' && json.bestMatch.trim()) {
    label = json.bestMatch.trim()
  }
  if (!label) return null

  const score = typeof best?.score === 'number' && Number.isFinite(best.score) ? best.score : null
  const confidence = score != null ? Math.max(0, Math.min(1, score)) : 0.5
  const commonName =
    best?.species?.commonNames?.map((n) => n.trim()).find((n) => n.length > 0) ?? null

  return {
    class_index: -1,
    confidence,
    label,
    commonName,
    source: 'plantnet',
  }
}

async function identifyViaServerProxy(
  imageBase64: string,
  signal?: AbortSignal,
): Promise<PredictResponse | null> {
  try {
    const res = await fetch(serverProxyUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, organ: 'leaf' }),
      signal,
    })
    const text = await res.text()
    if (!res.ok) {
      if (import.meta.env.DEV) {
        console.warn('[plantnet] API proxy', res.status, text.slice(0, 400))
      }
      return null
    }
    const json = JSON.parse(text) as PlantNetIdentifyResponse
    return mapPlantNetResponse(json)
  } catch {
    return null
  }
}

/**
 * Browser → Pl@ntNet (CORS). Requires `VITE_PLANTNET_API_KEY` and Pl@ntNet “expose key” + authorized domains.
 */
async function identifyViaPlantNetBrowser(
  imageDataUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PredictResponse | null> {
  const qs = `api-key=${encodeURIComponent(apiKey)}`
  const url = `${PLANTNET_IDENTIFY_URL}?${qs}`

  const fd = new FormData()
  fd.append('images', dataUrlToBlob(imageDataUrl), 'upload.jpg')
  fd.append('organs', 'auto')

  let res: Response
  try {
    res = await fetch(url, { method: 'POST', body: fd, signal })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/load failed|failed to fetch|networkerror/i.test(msg)) {
      throw new Error(
        'Could not reach Pl@ntNet from the browser. In the Pl@ntNet API key settings, add this site’s origin under “Authorized domains” (include http vs https), and ensure the key is exposed for client use.',
      )
    }
    throw e
  }
  const text = await res.text()
  if (!res.ok) {
    let detail = text
    try {
      const j = JSON.parse(text) as { message?: string; error?: string }
      detail = j.message || j.error || text
    } catch {
      /* keep text */
    }
    throw new Error(detail || `Pl@ntNet failed (${res.status})`)
  }

  const json = JSON.parse(text) as PlantNetIdentifyResponse
  return mapPlantNetResponse(json)
}

/**
 * Prefer direct browser → Pl@ntNet when `VITE_PLANTNET_API_KEY` is set (e.g. GitHub Actions build).
 * Falls back to same-origin `/api/plantnet/identify` proxy when the browser call fails or no key is set.
 */
export async function identifyWithPlantNet(
  imageDataUrl: string,
  signal?: AbortSignal,
): Promise<PredictResponse | null> {
  const base64 = stripDataUrlToBase64(imageDataUrl)
  if (!base64) return null

  const apiKey = getPlantNetApiKey()
  if (apiKey) {
    try {
      const direct = await identifyViaPlantNetBrowser(imageDataUrl, apiKey, signal)
      if (direct) return direct
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[plantnet] browser direct failed, trying API proxy if configured', e)
      }
    }
  }

  return identifyViaServerProxy(base64, signal)
}
