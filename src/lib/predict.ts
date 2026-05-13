export interface PredictResponse {
  class_index: number
  confidence: number
  label: string
  probabilities?: number[]
  /** Client-side annotation (e.g. "plantnet" when using fallback). */
  source?: 'model' | 'plantnet'
}

function getPredictApiUrl(): string {
  const fromEnv = import.meta.env.VITE_PREDICT_API_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim()
  // Same-origin in dev → vite proxy (see vite.config.ts `/dev/predict`) avoids CORS "Load failed".
  if (import.meta.env.DEV) return '/dev/predict'
  return 'https://7muezhf0bl.execute-api.ap-southeast-2.amazonaws.com/testing/predict'
}

function normalizeBase64(input: string): string {
  const s = String(input ?? '').trim()
  // If someone passes a data URL, strip the prefix.
  if (s.startsWith('data:')) {
    const parts = s.split(',', 2)
    return (parts[1] ?? '').replace(/\s+/g, '').trim()
  }
  return s.replace(/\s+/g, '').trim()
}

export async function predictPlantFromBase64(
  imageBase64: string,
  signal?: AbortSignal,
): Promise<PredictResponse> {
  const normalized = normalizeBase64(imageBase64)
  // Send both keys for backward-compatibility with older clients/backends.
  const payload = { image_base64: normalized, image: normalized }
  if (import.meta.env.DEV) {
    console.debug('[predict] sending', {
      keys: Object.keys(payload),
      base64Prefix: normalized.slice(0, 12),
      base64Chars: normalized.length,
    })
  }

  let res: Response
  try {
    res = await fetch(getPredictApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (/load failed|failed to fetch|networkerror/i.test(msg)) {
      throw new Error(
        'Could not reach the prediction API (network/CORS). In local dev, use `npm run dev` so `/dev/predict` is proxied, or set VITE_PREDICT_API_URL to an HTTPS endpoint that allows your origin.',
      )
    }
    throw e
  }

  const text = await res.text()

  // Better error surfacing (Lambda returns {"error": "..."} in the body)
  if (!res.ok) {
    try {
      const errJson = JSON.parse(text) as { error?: string }
      throw new Error(errJson?.error || text || `Predict failed (${res.status})`)
    } catch {
      throw new Error(text || `Predict failed (${res.status})`)
    }
  }

  const data = JSON.parse(text) as PredictResponse
  if (!data || typeof data.label !== 'string') throw new Error('Predict response malformed')

  // Some backends return confidence as 0–100; normalize to 0–1 for UI / PlantNet fallback threshold.
  let c = Number(data.confidence)
  if (!Number.isFinite(c)) c = 0
  if (c > 1 && c <= 100) c = c / 100
  data.confidence = Math.max(0, Math.min(1, c))

  return data
}
