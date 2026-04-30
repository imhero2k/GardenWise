export type PlannerGoal = 'bird' | 'pollinator'

export type PlannerRecommendationPlant = {
  id: string
  scientificName: string
  commonName: string | null
  lfCode: string | null
  growthForms: string[]
  floweringMonths: number[]
  floweringSeasons: string[]
  traits: {
    dispersers: string[]
    fruitFleshiness: string[]
    dispersalSyndromes: string[]
    pollinationSyndromes: string[]
  }
  reason: string
}

export type PlannerRecommendationGroup = {
  id: string
  title: string
  target: string
  reason: string
  requiredCount: number
  plants: PlannerRecommendationPlant[]
}

export type PlannerRecommendationsResponse = {
  goal: PlannerGoal
  regionName: string | null
  regionMatch: 'contained' | 'nearest' | null
  groups: PlannerRecommendationGroup[]
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  return typeof raw === 'string' ? raw.replace(/\/$/, '') : ''
}

export async function fetchPlannerRecommendations(
  goal: PlannerGoal,
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<PlannerRecommendationsResponse> {
  const qs = new URLSearchParams({
    goal,
    lat: String(lat),
    lng: String(lng),
  })
  const path = `/api/planner/recommendations?${qs.toString()}`
  const base = apiBase()
  const url = base ? `${base}${path}` : path
  const r = await fetch(url, { signal })
  if (!r.ok) {
    let msg = `Request failed (${r.status})`
    try {
      const j = (await r.json()) as { error?: string }
      if (j.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  const j = (await r.json()) as Partial<PlannerRecommendationsResponse>
  return {
    goal: j.goal === 'pollinator' ? 'pollinator' : 'bird',
    regionName: j.regionName ?? null,
    regionMatch: j.regionMatch ?? null,
    groups: Array.isArray(j.groups) ? j.groups : [],
  }
}
