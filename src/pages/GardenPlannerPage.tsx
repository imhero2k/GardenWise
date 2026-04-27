import { useMemo, useState } from 'react'
import { IconSearch } from '../components/Icons'
import {
  GardenPlannerScene,
  type PlacedPlant,
  type PlannerViewMode,
} from '../components/GardenPlannerScene'
import { PLANT_SPECS, type PlantForm, type PlantSpec } from '../data/plantSpecs'

const DEFAULT_WIDTH = 10
const DEFAULT_DEPTH = 6

const FORM_LABEL: Record<PlantForm, string> = {
  tree: 'Tree',
  shrub: 'Shrub',
  grass: 'Grass / tussock',
  groundcover: 'Groundcover',
  climber: 'Climber',
}

const FORM_ORDER: PlantForm[] = ['tree', 'shrub', 'grass', 'groundcover', 'climber']

function clampDim(raw: string, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.max(2, Math.min(60, n))
}

function spacingWarnings(placed: PlacedPlant[], specs: Record<string, PlantSpec>): string[] {
  const warnings: string[] = []
  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i]
      const b = placed[j]
      const sa = specs[a.specId]
      const sb = specs[b.specId]
      if (!sa || !sb) continue
      const dx = a.x - b.x
      const dz = a.z - b.z
      const dist = Math.hypot(dx, dz)
      const min = Math.max(sa.recommendedSpacing, sb.recommendedSpacing) * 0.85
      if (dist < min) {
        warnings.push(
          `${sa.commonName} and ${sb.commonName} are ${dist.toFixed(2)} m apart (aim for ≥ ${min.toFixed(2)} m).`,
        )
      }
    }
  }
  return warnings.slice(0, 5)
}

export function GardenPlannerPage() {
  const [widthStr, setWidthStr] = useState(String(DEFAULT_WIDTH))
  const [depthStr, setDepthStr] = useState(String(DEFAULT_DEPTH))
  const gardenWidth = clampDim(widthStr, DEFAULT_WIDTH)
  const gardenDepth = clampDim(depthStr, DEFAULT_DEPTH)

  const [search, setSearch] = useState('')
  const [pendingSpecId, setPendingSpecId] = useState<string | null>(null)
  const [placed, setPlaced] = useState<PlacedPlant[]>([])
  const [viewMode, setViewMode] = useState<PlannerViewMode>('iso')
  const [resetSignal, setResetSignal] = useState(0)

  const specsById = useMemo(() => {
    const m: Record<string, PlantSpec> = {}
    PLANT_SPECS.forEach((p) => {
      m[p.id] = p
    })
    return m
  }, [])

  const filteredSpecs = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = !q
      ? PLANT_SPECS
      : PLANT_SPECS.filter(
          (p) =>
            p.commonName.toLowerCase().includes(q) ||
            p.scientificName.toLowerCase().includes(q),
        )
    return [...list].sort((a, b) => {
      const fa = FORM_ORDER.indexOf(a.form)
      const fb = FORM_ORDER.indexOf(b.form)
      if (fa !== fb) return fa - fb
      return a.commonName.localeCompare(b.commonName)
    })
  }, [search])

  const pendingSpec = pendingSpecId ? specsById[pendingSpecId] ?? null : null

  const handlePlace = (x: number, z: number) => {
    if (!pendingSpec) return
    setPlaced((arr) => [
      ...arr,
      {
        uid: `${pendingSpec.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        specId: pendingSpec.id,
        x,
        z,
      },
    ])
  }

  const handleRemove = (uid: string) => {
    setPlaced((arr) => arr.filter((p) => p.uid !== uid))
  }

  const handleReset = () => {
    setPlaced([])
    setPendingSpecId(null)
  }

  const warnings = useMemo(() => spacingWarnings(placed, specsById), [placed, specsById])

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Plan</p>
        <h1>Garden planner</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Sketch your garden, pick native plants, and see how much space they really need when
          mature. Click a plant in the catalog, then click your garden to place it. Click a placed
          plant to remove it.
        </p>
      </header>

      <section className="card card-body" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="garden-planner-dims">
          <label>
            <span>Garden width (m)</span>
            <input
              type="number"
              min={2}
              max={60}
              step={0.5}
              value={widthStr}
              onChange={(e) => setWidthStr(e.target.value)}
            />
          </label>
          <label>
            <span>Garden depth (m)</span>
            <input
              type="number"
              min={2}
              max={60}
              step={0.5}
              value={depthStr}
              onChange={(e) => setDepthStr(e.target.value)}
            />
          </label>
          <div className="garden-planner-dims__actions">
            <button type="button" className="btn btn-ghost" onClick={handleReset} disabled={placed.length === 0}>
              Clear plants
            </button>
          </div>
        </div>
      </section>

      <div className="garden-planner-layout">
        <aside className="garden-planner-sidebar card card-body" aria-label="Plant catalog">
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Plant catalog</h2>
          <div className="search-field" style={{ marginBottom: 'var(--space-sm)' }}>
            <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
              <IconSearch />
            </span>
            <label htmlFor="planner-search" className="sr-only">
              Search plants
            </label>
            <input
              id="planner-search"
              type="search"
              placeholder="Search plants…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <ul className="garden-planner-catalog">
            {filteredSpecs.map((p) => {
              const active = pendingSpecId === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`garden-planner-catalog__item${active ? ' active' : ''}`}
                    onClick={() => setPendingSpecId(active ? null : p.id)}
                    aria-pressed={active}
                  >
                    <span
                      className="garden-planner-catalog__swatch"
                      style={{ background: p.canopyColor }}
                      aria-hidden
                    />
                    <span className="garden-planner-catalog__text">
                      <span className="garden-planner-catalog__name">{p.commonName}</span>
                      <span className="garden-planner-catalog__sci">{p.scientificName}</span>
                      <span className="garden-planner-catalog__meta">
                        {FORM_LABEL[p.form]} · {p.matureWidth}×{p.matureHeight}m
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
            {filteredSpecs.length === 0 && (
              <li style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', padding: 'var(--space-sm) 0' }}>
                No matches.
              </li>
            )}
          </ul>
        </aside>

        <div className="garden-planner-stage">
          <div className="garden-planner-viewbar" role="toolbar" aria-label="View controls">
            <div className="garden-planner-viewbar__group" role="group" aria-label="Camera angle">
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'iso' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('iso')}
                aria-pressed={viewMode === 'iso'}
              >
                3D view
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'top' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setViewMode('top')}
                aria-pressed={viewMode === 'top'}
              >
                Top-down
              </button>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setResetSignal((n) => n + 1)}
            >
              Reset view
            </button>
          </div>
          <GardenPlannerScene
            gardenWidth={gardenWidth}
            gardenDepth={gardenDepth}
            placed={placed}
            specsById={specsById}
            pendingSpec={pendingSpec}
            viewMode={viewMode}
            resetSignal={resetSignal}
            onPlace={handlePlace}
            onRemove={handleRemove}
          />
          <div className="garden-planner-hint">
            {pendingSpec ? (
              <>
                Placing <strong>{pendingSpec.commonName}</strong> — click inside the garden.
                Footprint will be <strong>{pendingSpec.matureWidth.toFixed(1)} m</strong> wide
                (minimum spacing ≈ {pendingSpec.recommendedSpacing.toFixed(1)} m).
                {pendingSpec.note ? <> {pendingSpec.note}</> : null}
              </>
            ) : (
              <>Left-drag to rotate · right-drag to pan · scroll to zoom · click a plant in the catalog to start placing.</>
            )}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <section className="card card-body" style={{ marginTop: 'var(--space-md)', borderColor: 'var(--color-warning)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Spacing tips</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 'var(--space-sm) 0 0' }}>
            Guides only, using approximate mature sizes. Very tall plants on the north side of smaller ones can also
            block winter sun — try moving tall species to the south.
          </p>
        </section>
      )}

      <section className="card card-body" style={{ marginTop: 'var(--space-md)' }}>
        <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Placed plants ({placed.length})</h2>
        {placed.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
            Nothing placed yet. Pick a plant from the catalog and click the garden.
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
            {placed.map((p) => {
              const s = specsById[p.specId]
              if (!s) return null
              return (
                <li key={p.uid}>
                  {s.commonName} at ({p.x.toFixed(1)} m, {p.z.toFixed(1)} m) — mature{' '}
                  {s.matureWidth.toFixed(1)} m wide × {s.matureHeight.toFixed(1)} m tall.{' '}
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => handleRemove(p.uid)}
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </>
  )
}
