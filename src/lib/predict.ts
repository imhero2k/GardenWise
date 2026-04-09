export interface PredictResponse {
  class_index: number
  confidence: number
  label: string
  probabilities?: number[]
}

function getPredictApiUrl(): string {
  const fromEnv = import.meta.env.VITE_PREDICT_API_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim()
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

  const res = await fetch(getPredictApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

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
  return data
}
