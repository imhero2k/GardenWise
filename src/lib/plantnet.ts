import type { PredictResponse } from './predict'
import { getApiBaseUrl } from '../config/runtimeConfig'

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

function serverProxyUrl(): string {
  const b = getApiBaseUrl()
  return b ? `${b}/api/plantnet/identify` : '/api/plantnet/identify'
}

function stripDataUrlToBase64(dataUrl: string): string {
  const s = String(dataUrl ?? '').trim()
  if (s.startsWith('data:')) return (s.split(',', 2)[1] ?? '').replace(/\s+/g, '').trim()
  return s.replace(/\s+/g, '').trim()
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

/** Send Pl@ntNet requests through the API so its key stays server-side. */
export async function identifyWithPlantNet(
  imageDataUrl: string,
  signal?: AbortSignal,
): Promise<PredictResponse | null> {
  const base64 = stripDataUrlToBase64(imageDataUrl)
  if (!base64) return null

  return identifyViaServerProxy(base64, signal)
}
