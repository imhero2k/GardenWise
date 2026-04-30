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

type GardenGoal = 'free' | 'bird' | 'pollinator'
type ProgressState = 'complete' | 'active' | 'waiting'

interface GoalOption {
  id: GardenGoal
  label: string
  shortLabel: string
  tone: 'neutral' | 'bird' | 'pollinator'
}

interface GoalCatalogGroup {
  id: string
  title: string
  target: string
  description: string
  criteria: string[]
  slots: number
}

interface FormCounts {
  total: number
  canopy: number
  mid: number
  ground: number
  front: number
  back: number
}

interface ProgressItem {
  title: string
  detail: string
  state: ProgressState
}

const FORM_LABEL: Record<PlantForm, string> = {
  tree: 'Tree',
  shrub: 'Shrub',
  grass: 'Grass / tussock',
  groundcover: 'Groundcover',
  climber: 'Climber',
}

const FORM_ORDER: PlantForm[] = ['tree', 'shrub', 'grass', 'groundcover', 'climber']

const GOAL_OPTIONS: GoalOption[] = [
  { id: 'free', label: 'Free planning', shortLabel: 'Free', tone: 'neutral' },
  { id: 'bird', label: 'Bird-friendly garden', shortLabel: 'Bird-friendly', tone: 'bird' },
  { id: 'pollinator', label: 'Pollinator garden', shortLabel: 'Pollinator', tone: 'pollinator' },
]

const BIRD_GROUPS: GoalCatalogGroup[] = [
  {
    id: 'canopy',
    title: 'Canopy layer',
    target: '1 tree species',
    description: 'A tree creates the upper layer for perching, shade, and vertical habitat.',
    criteria: ['form = tree', 'structural layer = canopy'],
    slots: 1,
  },
  {
    id: 'mid',
    title: 'Mid-layer shrubs',
    target: '2 shrub species',
    description: 'Shrubs create protected movement space between the ground and canopy.',
    criteria: ['form = shrub', 'shelter for small birds', 'priority if fruit traits support birds'],
    slots: 2,
  },
  {
    id: 'ground',
    title: 'Ground layer',
    target: '3 herb, subshrub, or groundcover species',
    description: 'Low plants fill the understory and help support insects and foraging.',
    criteria: ['form = herb, subshrub, or groundcover', 'flowering ground layer preferred'],
    slots: 3,
  },
  {
    id: 'food',
    title: 'Bird food plants',
    target: 'At least 2 food-resource species',
    description: 'The database recommendation will prioritise fleshy-fruited, bird-dispersed plants.',
    criteria: [
      'dispersers = birds',
      'fruit_fleshiness = fleshy',
      'dispersal_syndrome in (zoochory, endozoochory)',
    ],
    slots: 2,
  },
]

const POLLINATOR_GROUPS: GoalCatalogGroup[] = [
  {
    id: 'front',
    title: 'Front nectar layer',
    target: '4-6 herb, subshrub, or low shrub species',
    description: 'The front layer carries the main nectar sequence and stays easy to inspect.',
    criteria: ['pollination_syndrome in (bee, insect)', 'flowering_time covers target seasons'],
    slots: 4,
  },
  {
    id: 'back',
    title: 'Back shelter layer',
    target: '2-3 shrub or tree species',
    description: 'The back layer acts as a windbreak, visual backdrop, and extra nectar source.',
    criteria: ['form = shrub or tree', 'background cover', 'additional flowering value preferred'],
    slots: 3,
  },
  {
    id: 'seasons',
    title: 'Flowering coverage',
    target: 'At least 3 seasons',
    description: 'The final mix should provide a steady flower supply rather than one short peak.',
    criteria: ['at least 3 covered seasons', 'at least 3 species flowering in each covered season'],
    slots: 3,
  },
]

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

function placedCounts(placed: PlacedPlant[], specs: Record<string, PlantSpec>): FormCounts {
  return placed.reduce<FormCounts>(
    (counts, item) => {
      const spec = specs[item.specId]
      if (!spec) return counts

      counts.total += 1
      if (spec.form === 'tree') counts.canopy += 1
      if (spec.form === 'shrub') counts.mid += 1
      if (spec.form === 'grass' || spec.form === 'groundcover' || spec.form === 'climber') counts.ground += 1
      if (spec.form === 'grass' || spec.form === 'groundcover' || spec.form === 'climber') counts.front += 1
      if (spec.form === 'tree' || spec.form === 'shrub') counts.back += 1

      return counts
    },
    { total: 0, canopy: 0, mid: 0, ground: 0, front: 0, back: 0 },
  )
}

function groupStatusText(goal: GardenGoal, groupId: string, counts: FormCounts): string {
  if (goal === 'bird') {
    if (groupId === 'canopy') return `${Math.min(counts.canopy, 1)}/1 placed`
    if (groupId === 'mid') return `${Math.min(counts.mid, 2)}/2 placed`
    if (groupId === 'ground') return `${Math.min(counts.ground, 3)}/3 placed`
    return 'Awaiting trait data'
  }

  if (goal === 'pollinator') {
    if (groupId === 'front') return `${Math.min(counts.front, 4)}/4 min placed`
    if (groupId === 'back') return `${Math.min(counts.back, 2)}/2 min placed`
    return 'Awaiting bloom data'
  }

  return ''
}

function activeGroupId(goal: GardenGoal, counts: FormCounts): string | null {
  if (goal === 'bird') {
    if (counts.canopy < 1) return 'canopy'
    if (counts.mid < 2) return 'mid'
    if (counts.ground < 3) return 'ground'
    return 'food'
  }

  if (goal === 'pollinator') {
    if (counts.front < 4) return 'front'
    if (counts.back < 2) return 'back'
    return 'seasons'
  }

  return null
}

function goalHeadline(goal: GardenGoal, counts: FormCounts): string {
  if (goal === 'bird') {
    if (counts.canopy < 1) return 'Next task is canopy tree'
    if (counts.mid < 2) return 'Next task is mid-layer shrub'
    if (counts.ground < 3) return 'Next task is ground layer'
    return 'Structure is ready for database trait checks'
  }

  if (goal === 'pollinator') {
    if (counts.front < 4) return 'Next task is front nectar layer'
    if (counts.back < 2) return 'Next task is back shelter layer'
    return 'Layer counts are ready for flowering checks'
  }

  if (counts.total === 0) return 'Start with any plant from the catalog'
  return `${counts.total} plant${counts.total === 1 ? '' : 's'} placed`
}

function goalProgress(goal: GardenGoal, counts: FormCounts): number {
  if (goal === 'bird') {
    return Math.round(((Math.min(counts.canopy, 1) + Math.min(counts.mid, 2) + Math.min(counts.ground, 3)) / 6) * 100)
  }
  if (goal === 'pollinator') {
    return Math.round(((Math.min(counts.front, 4) + Math.min(counts.back, 2)) / 6) * 100)
  }
  return counts.total > 0 ? 100 : 0
}

function goalProgressItems(goal: GardenGoal, counts: FormCounts): ProgressItem[] {
  if (goal === 'bird') {
    return [
      {
        title: 'Canopy layer',
        detail: `${counts.canopy} tree${counts.canopy === 1 ? '' : 's'} placed; target is 1 species.`,
        state: counts.canopy >= 1 ? 'complete' : 'active',
      },
      {
        title: 'Mid-layer shrubs',
        detail: `${counts.mid} shrub${counts.mid === 1 ? '' : 's'} placed; target is 2 species.`,
        state: counts.mid >= 2 ? 'complete' : counts.canopy >= 1 ? 'active' : 'waiting',
      },
      {
        title: 'Ground layer',
        detail: `${counts.ground} low plant${counts.ground === 1 ? '' : 's'} placed; target is 3 species.`,
        state: counts.ground >= 3 ? 'complete' : counts.mid >= 2 ? 'active' : 'waiting',
      },
      {
        title: 'Bird food traits',
        detail: 'Needs 2 fleshy-fruited or bird-dispersed species once database traits are connected.',
        state: counts.canopy >= 1 && counts.mid >= 2 && counts.ground >= 3 ? 'active' : 'waiting',
      },
      {
        title: 'Flowering ground support',
        detail: 'Ground layer flowering support will be validated from flowering trait data.',
        state: 'waiting',
      },
    ]
  }

  if (goal === 'pollinator') {
    return [
      {
        title: 'Front nectar layer',
        detail: `${counts.front} low plant${counts.front === 1 ? '' : 's'} placed; target starts at 4 species.`,
        state: counts.front >= 4 ? 'complete' : 'active',
      },
      {
        title: 'Back shelter layer',
        detail: `${counts.back} shrub/tree plant${counts.back === 1 ? '' : 's'} placed; target starts at 2 species.`,
        state: counts.back >= 2 ? 'complete' : counts.front >= 4 ? 'active' : 'waiting',
      },
      {
        title: 'Flowering seasons',
        detail: 'Needs at least 3 seasons with at least 3 species flowering in each covered season.',
        state: counts.front >= 4 && counts.back >= 2 ? 'active' : 'waiting',
      },
      {
        title: 'Pollinator syndrome',
        detail: 'Species will be screened for bee or insect pollination once the database is connected.',
        state: 'waiting',
      },
    ]
  }

  return [
    {
      title: 'Manual layout',
      detail: `${counts.total} plant${counts.total === 1 ? '' : 's'} placed in free planning mode.`,
      state: counts.total > 0 ? 'complete' : 'active',
    },
  ]
}

function goalReasons(goal: GardenGoal): string[] {
  if (goal === 'bird') {
    return [
      'Bird-friendly planting is built around vertical structure: canopy, shrub shelter, and a low foraging layer.',
      'Food-resource species are prioritised by dispersal and fruit traits rather than by name alone.',
      'Flowering ground plants help maintain insect populations, which adds another food pathway for birds.',
    ]
  }

  if (goal === 'pollinator') {
    return [
      'Pollinator planting should keep flowers available across seasons, not only maximise one attractive plant.',
      'Front-layer plants carry the primary nectar sequence, while shrubs and trees reduce wind and add cover.',
      'The final recommendation should cover at least 3 flowering seasons with enough species in each season.',
    ]
  }

  return [
    'Free planning keeps the existing manual catalog available for quick layout and spacing checks.',
  ]
}

export function GardenPlannerPage() {
  const [widthStr, setWidthStr] = useState(String(DEFAULT_WIDTH))
  const [depthStr, setDepthStr] = useState(String(DEFAULT_DEPTH))
  const gardenWidth = clampDim(widthStr, DEFAULT_WIDTH)
  const gardenDepth = clampDim(depthStr, DEFAULT_DEPTH)

  const [goal, setGoal] = useState<GardenGoal>('free')
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
  const counts = useMemo(() => placedCounts(placed, specsById), [placed, specsById])
  const currentGoal = GOAL_OPTIONS.find((option) => option.id === goal) ?? GOAL_OPTIONS[0]
  const currentActiveGroupId = activeGroupId(goal, counts)
  const progressItems = goalProgressItems(goal, counts)
  const reasons = goalReasons(goal)

  const handleGoalChange = (nextGoal: GardenGoal) => {
    setGoal(nextGoal)
    setSearch('')
    setPendingSpecId(null)
  }

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
  const goalGroups = goal === 'bird' ? BIRD_GROUPS : goal === 'pollinator' ? POLLINATOR_GROUPS : []

  return (
    <div className="garden-planner-page">
      <header className="page-header">
        <p className="eyebrow">Plan</p>
        <h1>Garden planner</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Build a planting layout around a habitat goal, then use the planner to test spacing and
          structure before the database-backed recommendations are connected.
        </p>
      </header>

      <section className="card card-body garden-goal-panel" aria-label="Garden goal">
        <div className="garden-goal-panel__label">Garden goal</div>
        <div className="garden-goal-options" role="group" aria-label="Garden goal">
          {GOAL_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`garden-goal-chip garden-goal-chip--${option.tone}${goal === option.id ? ' active' : ''}`}
              onClick={() => handleGoalChange(option.id)}
              aria-pressed={goal === option.id}
            >
              <span className="garden-goal-chip__dot" aria-hidden />
              {option.shortLabel}
            </button>
          ))}
        </div>
      </section>

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

      <p className="garden-planner-state">
        {currentGoal.label}: {goalHeadline(goal, counts)}
      </p>

      <div className="garden-planner-layout">
        <aside className="garden-planner-sidebar card card-body" aria-label="Plant catalog">
          {goal === 'free' ? (
            <>
              <h2 className="garden-planner-panel-title">Plant catalog</h2>
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
                  placeholder="Search plants..."
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
            </>
          ) : (
            <>
              <h2 className="garden-planner-panel-title">Goal recommendations</h2>
              <p className="garden-planner-sidebar-note">
                Species slots are intentionally blank until the backend returns database-matched recommendations.
              </p>
              <ul className="garden-goal-catalog">
                {goalGroups.map((group) => {
                  const isActive = group.id === currentActiveGroupId
                  return (
                    <li
                      key={group.id}
                      className={`garden-goal-catalog__group${isActive ? ' active' : ''}`}
                    >
                      <div className="garden-goal-catalog__head">
                        <div>
                          <h3>{group.title}</h3>
                          <p>{group.target}</p>
                        </div>
                        <span>{groupStatusText(goal, group.id, counts)}</span>
                      </div>
                      <p className="garden-goal-catalog__description">{group.description}</p>
                      <div className="garden-goal-catalog__criteria" aria-label={`${group.title} criteria`}>
                        {group.criteria.map((criterion) => (
                          <span key={criterion}>{criterion}</span>
                        ))}
                      </div>
                      <div className="garden-goal-slots" aria-label={`${group.title} recommendation slots`}>
                        {Array.from({ length: group.slots }, (_, index) => (
                          <span key={index}>Species slot {index + 1}</span>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
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
                Placing <strong>{pendingSpec.commonName}</strong> - click inside the garden.
                Footprint will be <strong>{pendingSpec.matureWidth.toFixed(1)} m</strong> wide
                (minimum spacing ≈ {pendingSpec.recommendedSpacing.toFixed(1)} m).
                {pendingSpec.note ? <> {pendingSpec.note}</> : null}
              </>
            ) : goal === 'free' ? (
              <>Left-drag to rotate · right-drag to pan · scroll to zoom · click a plant in the catalog to start placing.</>
            ) : (
              <>Goal mode is waiting for database recommendations; use Free to place plants manually for now.</>
            )}
          </div>
        </div>

        <aside className="garden-planner-insights card card-body" aria-label="Recommendation reason and setup progress">
          <div className="garden-goal-summary">
            <p>{currentGoal.label}</p>
            <h2>{goalHeadline(goal, counts)}</h2>
            <div className="garden-goal-progress" aria-label={`${goalProgress(goal, counts)} percent complete`}>
              <span style={{ width: `${goalProgress(goal, counts)}%` }} />
            </div>
          </div>

          <div className="planner-progress-list" aria-label="Completed setup">
            {progressItems.map((item, index) => (
              <div
                key={item.title}
                className={`planner-progress-item planner-progress-item--${item.state}`}
              >
                <span className="planner-progress-item__marker" aria-hidden>
                  {item.state === 'complete' ? '✓' : index + 1}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
              </div>
            ))}
          </div>

          <section className="garden-goal-reasons" aria-label="Recommendation reasons">
            <h3>Why this recommendation?</h3>
            {reasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </section>

          <section className="garden-current-setup" aria-label="Current setup">
            <h3>Current setup</h3>
            <dl>
              <div>
                <dt>Garden size</dt>
                <dd>{gardenWidth} m × {gardenDepth} m</dd>
              </div>
              <div>
                <dt>Placed plants</dt>
                <dd>{counts.total}</dd>
              </div>
              <div>
                <dt>Canopy / mid / ground</dt>
                <dd>{counts.canopy} / {counts.mid} / {counts.ground}</dd>
              </div>
            </dl>
            {placed.length === 0 ? (
              <p className="garden-current-setup__empty">
                No plants placed yet.
              </p>
            ) : (
              <ul className="garden-current-setup__plants">
                {placed.map((p) => {
                  const s = specsById[p.specId]
                  if (!s) return null
                  return (
                    <li key={p.uid}>
                      <span>
                        <strong>{s.commonName}</strong>
                        <small>
                          {FORM_LABEL[s.form]} · {p.x.toFixed(1)} m, {p.z.toFixed(1)} m
                        </small>
                      </span>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => handleRemove(p.uid)}
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </aside>
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
            block winter sun - try moving tall species to the south.
          </p>
        </section>
      )}
    </div>
  )
}
