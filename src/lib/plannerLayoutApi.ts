import type { PlantSpec } from '../data/plantSpecs'
import type { PlacedPlant } from '../components/GardenPlannerScene'
import { getFirebaseAuth, isFirebaseAuthConfigured } from '../auth/firebase'

/**
 * Persisted planner state (stored in DynamoDB via API).
 * `specsPatch` holds full `PlantSpec` for ids not bundled in static catalog (e.g. `db-123`).
 */

export type PlannerGoalPersisted = 'free' | 'bird' | 'pollinator'

export type PlannerLayoutPayloadV1 = {
  version: 1
  widthStr: string
  depthStr: string
  goal: PlannerGoalPersisted
  viewMode: 'iso' | 'top'
  placed: Pick<PlacedPlant, 'uid' | 'specId' | 'x' | 'z'>[]
  specsPatch?: Record<string, PlantSpec>
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

function isPlannerLayoutPayloadV1(x: unknown): x is PlannerLayoutPayloadV1 {
  if (!x || typeof x !== 'object') return false
  const o = x as PlannerLayoutPayloadV1
  if (o.version !== 1) return false
  if (typeof o.widthStr !== 'string' || typeof o.depthStr !== 'string') return false
  if (o.goal !== 'free' && o.goal !== 'bird' && o.goal !== 'pollinator') return false
  if (o.viewMode !== 'iso' && o.viewMode !== 'top') return false
  return Array.isArray(o.placed)
}

export async function fetchPlannerLayoutFromApi(signal?: AbortSignal): Promise<{
  layout: PlannerLayoutPayloadV1 | null
  updatedAt: string | null
}> {
  if (!isFirebaseAuthConfigured()) {
    throw new Error('Firebase is not configured')
  }
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')

  const token = await user.getIdToken()
  const base = apiBase()
  const path = '/api/planner/layout'
  const url = base ? `${base}${path}` : path
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  const text = await res.text()
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string }
      throw new Error(j.error || `Load failed (${res.status})`)
    } catch {
      throw new Error(text || `Load failed (${res.status})`)
    }
  }
  const j = JSON.parse(text) as { layout?: unknown; updatedAt?: string | null }
  const layoutRaw = j.layout
  const layout =
    layoutRaw !== undefined && layoutRaw !== null ? (isPlannerLayoutPayloadV1(layoutRaw) ? layoutRaw : null) : null
  return {
    layout,
    updatedAt: j.updatedAt ?? null,
  }
}

export async function savePlannerLayoutToApi(
  payload: PlannerLayoutPayloadV1,
  signal?: AbortSignal,
): Promise<{ updatedAt: string }> {
  if (!isFirebaseAuthConfigured()) {
    throw new Error('Firebase is not configured')
  }
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')

  const token = await user.getIdToken()
  const base = apiBase()
  const path = '/api/planner/layout'
  const url = base ? `${base}${path}` : path
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  })
  const text = await res.text()
  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { error?: string }
      throw new Error(j.error || `Save failed (${res.status})`)
    } catch {
      throw new Error(text || `Save failed (${res.status})`)
    }
  }
  const j = JSON.parse(text) as { updatedAt?: string }
  return { updatedAt: j.updatedAt ?? new Date().toISOString() }
}
