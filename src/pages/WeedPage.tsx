import { type ChangeEventHandler, useId, useRef, useState } from 'react'
import { IconCamera } from '../components/Icons'
import type { PredictResponse } from '../lib/predict'
import { predictPlantFromBase64 } from '../lib/predict'

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error'

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

export function WeedPage() {
  const inputId = useId()
  const [state, setState] = useState<AnalysisState>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageInfo, setImageInfo] = useState<{ bytes: number; base64Chars: number } | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleFile: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState('analyzing')
    setError(null)
    setResult(null)
    setImageInfo(null)

    try {
      const dataUrl = await fileToDataUrl(file)
      setPreviewUrl(dataUrl)

      const base64 = dataUrl.startsWith('data:') ? dataUrl.split(',', 2)[1] ?? '' : dataUrl
      // Remove whitespace/newlines just in case (some environments insert line breaks)
      const trimmed = base64.replace(/\s+/g, '').trim()
      if (!trimmed) throw new Error('Could not encode image (empty payload)')

      // Approx bytes (base64 -> 3/4) without padding
      const pad = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0
      const approxBytes = Math.max(0, Math.floor((trimmed.length * 3) / 4) - pad)
      setImageInfo({ bytes: approxBytes, base64Chars: trimmed.length })

      const pred = await predictPlantFromBase64(trimmed, controller.signal)
      setResult(pred)
      setState('done')
    } catch (err) {
      if (controller.signal.aborted) return
      setState('error')
      setError(err instanceof Error ? err.message : 'Prediction failed')
    }
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Identify</p>
        <h1>Weed identification</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Upload a photo or use your camera — we will identify the plant and return a confidence score.
        </p>
      </header>

      <label htmlFor={inputId} className="upload-zone" style={{ display: 'block' }}>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFile}
        />
        <IconCamera />
        <p style={{ margin: 'var(--space-sm) 0 0', fontWeight: 600 }}>Tap to upload or scan</p>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          JPG or PNG — sent to the prediction API
        </p>
      </label>

      {previewUrl && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Selected image</h2>
          <img
            src={previewUrl}
            alt="Uploaded plant preview"
            style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
          />
          {imageInfo && (
            <p style={{ margin: 'var(--space-md) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Payload: ~{Math.round(imageInfo.bytes / 1024)} KB ({imageInfo.base64Chars.toLocaleString()} base64 chars)
            </p>
          )}
        </div>
      )}

      {state === 'analyzing' && (
        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
          Analysing image…
        </p>
      )}

      {state === 'error' && error && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-sm)' }}>Couldn’t analyse that image</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      )}

      {state === 'done' && result && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Likely match</h2>
          <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>{result.label}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Confidence</div>
              <div style={{ fontWeight: 700 }}>{Math.round(result.confidence * 10000) / 100}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Class index</div>
              <div style={{ fontWeight: 700 }}>{result.class_index}</div>
            </div>
          </div>

          {Array.isArray(result.probabilities) && result.probabilities.length > 0 && (
            <details style={{ marginTop: 'var(--space-md)' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                Show model probabilities
              </summary>
              <pre
                style={{
                  marginTop: 'var(--space-sm)',
                  background: 'rgba(0,0,0,0.04)',
                  padding: 'var(--space-sm)',
                  borderRadius: 'var(--radius-md)',
                  overflowX: 'auto',
                }}
              >
                {JSON.stringify(result.probabilities.slice(0, 50), null, 2)}
              </pre>
            </details>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
            Always confirm ID with your state biosecurity resource. This feature uses an ML model and can be wrong.
          </p>
        </div>
      )}
    </>
  )
}
