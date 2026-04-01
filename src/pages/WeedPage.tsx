import { useId, useState } from 'react'
import { RiskBadge } from '../components/RiskBadge'
import { IconCamera } from '../components/Icons'

type AnalysisState = 'idle' | 'analyzing' | 'done'

export function WeedPage() {
  const inputId = useId()
  const [state, setState] = useState<AnalysisState>('idle')

  const handleFile = () => {
    setState('analyzing')
    window.setTimeout(() => setState('done'), 1400)
  }

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Identify</p>
        <h1>Weed identification</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Upload a photo or use your camera — we will highlight invasive risk and safe removal basics.
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
          JPG or PNG — demo analysis runs locally
        </p>
      </label>

      {state === 'analyzing' && (
        <p style={{ textAlign: 'center', marginTop: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
          Analysing leaf shape and growth habit…
        </p>
      )}

      {state === 'done' && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-lg)' }}>
          <h2 style={{ marginBottom: 'var(--space-md)' }}>Likely match (demo)</h2>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Lantana (Lantana camara)</p>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <span style={{ marginRight: 'var(--space-sm)' }}>Is this invasive?</span>
            <strong style={{ color: 'var(--color-danger)' }}>Yes</strong> — in many Australian regions
          </div>
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <RiskBadge level="High" />
          </div>
          <h3 style={{ fontSize: '0.95rem' }}>Removal instructions</h3>
          <ol style={{ color: 'var(--color-text-muted)', paddingLeft: '1.2rem', margin: 0 }}>
            <li>Wear gloves and long sleeves — sap may irritate skin.</li>
            <li>Cut back bulk, then dig out roots; bag seed heads before disposal.</li>
            <li>Dispose via council green waste protocols — do not compost seeds.</li>
            <li>Replant with dense native groundcover to suppress regrowth.</li>
          </ol>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-md)' }}>
            Always confirm ID with your state biosecurity resource. This screen is a UI demo.
          </p>
        </div>
      )}
    </>
  )
}
