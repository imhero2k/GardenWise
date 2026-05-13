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

  return {
    class_index: -1,
    confidence,
    label,
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

async function identifyViaViteDevProxy(
  imageDataUrl: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<PredictResponse | null> {
  const qs = `api-key=${encodeURIComponent(apiKey)}`
  const url = `/dev/plantnet/v2/identify/all?${qs}`

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
        'Could not reach Pl@ntNet. Run `npm run dev` (Vite proxy) and/or `npm run dev:api` with PLANTNET_API_KEY or VITE_PLANTNET_API_KEY in .env.local.',
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
 * Prefer same-origin API proxy (no Pl@ntNet browser CORS). Falls back to Vite `/dev/plantnet` in dev
 * with VITE_PLANTNET_API_KEY when the API server is not running.
 */
export async function identifyWithPlantNet(
  imageDataUrl: string,
  signal?: AbortSignal,
): Promise<PredictResponse | null> {
  const base64 = stripDataUrlToBase64(imageDataUrl)
  if (!base64) return null

  const viaServer = await identifyViaServerProxy(base64, signal)
  if (viaServer) return viaServer

  const apiKey = getPlantNetApiKey()
  if (!apiKey || !import.meta.env.DEV || import.meta.env.VITE_PLANTNET_DIRECT === 'true') {
    return null
  }

  try {
    return await identifyViaViteDevProxy(imageDataUrl, apiKey, signal)
  } catch {
    return null
  }
}
