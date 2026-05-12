import { useEffect, useMemo, useRef, useState } from 'react'
import { IconSearch } from '../components/Icons'
import { FeatureIcon } from '../components/FeatureIcons'
import {
  GardenPlannerScene,
  type PlacedPlant,
  type PlannerViewMode,
} from '../components/GardenPlannerScene'
import { isFirebaseAuthConfigured } from '../auth/firebase'
import { useAuth } from '../context/useAuth'
import { useLocationArea } from '../context/LocationContext'
import { PLANT_SPECS, type PlantForm, type PlantSpec } from '../data/plantSpecs'
import {
  FEATURE_SPECS,
  FEATURE_CATEGORY_LABEL,
  FEATURE_CATEGORY_ORDER,
  isFeatureSpec,
  type FeatureCategory,
  type FeatureSpec,
} from '../data/featureSpecs'
import {
  fetchPlannerRecommendations,
  type PlannerGoal,
  type PlannerRecommendationGroup,
  type PlannerRecommendationPlant,
  type PlannerRecommendationsResponse,
} from '../lib/plannerRecommendationsApi'
import {
  fetchPlannerLayoutFromApi,
  savePlannerLayoutToApi,
  type PlannerLayoutPayloadV1,
} from '../lib/plannerLayoutApi'

const DEFAULT_WIDTH = 10
const DEFAULT_DEPTH = 6

type AnySpec = PlantSpec | FeatureSpec

const LOCAL_PLANNER_SPEC_IDS = new Set<string>([
  ...PLANT_SPECS.map((p) => p.id),
  ...FEATURE_SPECS.map((f) => f.id),
])

/** Persist full specs for placements not backed by bundled catalogs (database picks). */
function plannerSpecsPatchForSave(
  placed: PlacedPlant[],
  specsById: Record<string, AnySpec>,
): Record<string, PlantSpec> | undefined {
  const out: Record<string, PlantSpec> = {}
  for (const pid of [...new Set(placed.map((p) => p.specId))]) {
    if (LOCAL_PLANNER_SPEC_IDS.has(pid)) continue
    const s = specsById[pid]
    if (s && !isFeatureSpec(s)) out[pid] = s
  }
  return Object.keys(out).length > 0 ? out : undefined
}

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
  /** Total habitat features placed (any kind). */
  features: number
  /** Nest boxes — bird nesting cavity target. */
  nestBoxes: number
  /** Insect hotels — pollinator/insect shelter target. */
  insectHotels: number
  /** Rock piles + log piles — ground shelter target. */
  groundShelters: number
  /** Bird baths + shallow dishes — water source target. */
  waterSources: number
}

interface ProgressItem {
  title: string
  detail: string
  state: ProgressState
}

interface LfCodeProfile {
  label: string
  widthLabel: string
  matureWidth: number
  matureHeight: number
  recommendedSpacing: number
  form: PlantForm
  canopyColor: string
}

const FORM_LABEL: Record<PlantForm, string> = {
  tree: 'Tree',
  shrub: 'Shrub',
  grass: 'Grass / tussock',
  groundcover: 'Groundcover',
  climber: 'Climber',
}

const FORM_ORDER: PlantForm[] = ['tree', 'shrub', 'grass', 'groundcover', 'climber']

const LF_CODE_PROFILES: Record<string, LfCodeProfile> = {
  MS: {
    label: 'Medium Shrub',
    widthLabel: '1.5-3 m',
    matureWidth: 2.25,
    matureHeight: 2.2,
    recommendedSpacing: 2,
    form: 'shrub',
    canopyColor: '#789b4f',
  },
  SS: {
    label: 'Small Shrub',
    widthLabel: '0.5-1.5 m',
    matureWidth: 1,
    matureHeight: 1,
    recommendedSpacing: 0.9,
    form: 'shrub',
    canopyColor: '#86a95d',
  },
  T: {
    label: 'Tree',
    widthLabel: '5-15 m',
    matureWidth: 10,
    matureHeight: 12,
    recommendedSpacing: 9,
    form: 'tree',
    canopyColor: '#4f7f3b',
  },
  MH: {
    label: 'Medium Herb',
    widthLabel: '0.3-0.8 m',
    matureWidth: 0.55,
    matureHeight: 0.55,
    recommendedSpacing: 0.45,
    form: 'groundcover',
    canopyColor: '#9ccf84',
  },
  PS: {
    label: 'Prostrate Shrub',
    widthLabel: '1-3 m',
    matureWidth: 2,
    matureHeight: 0.45,
    recommendedSpacing: 1.5,
    form: 'groundcover',
    canopyColor: '#8fbf76',
  },
  SH: {
    label: 'Small Herb',
    widthLabel: '0.1-0.4 m',
    matureWidth: 0.25,
    matureHeight: 0.25,
    recommendedSpacing: 0.2,
    form: 'groundcover',
    canopyColor: '#a9d892',
  },
  GF: {
    label: 'Ground Fern',
    widthLabel: '0.3-1 m',
    matureWidth: 0.65,
    matureHeight: 0.55,
    recommendedSpacing: 0.5,
    form: 'groundcover',
    canopyColor: '#79a967',
  },
  LH: {
    label: 'Large Herb',
    widthLabel: '0.8-2 m',
    matureWidth: 1.4,
    matureHeight: 1.4,
    recommendedSpacing: 1.1,
    form: 'groundcover',
    canopyColor: '#9ccf84',
  },
  EP: {
    label: 'Epiphyte',
    widthLabel: '0.1-0.5 m',
    matureWidth: 0.3,
    matureHeight: 0.35,
    recommendedSpacing: 0.25,
    form: 'groundcover',
    canopyColor: '#8fbf76',
  },
  MTG: {
    label: 'Medium Tufted Grass',
    widthLabel: '0.4-1 m',
    matureWidth: 0.7,
    matureHeight: 0.8,
    recommendedSpacing: 0.55,
    form: 'grass',
    canopyColor: '#a6bc64',
  },
  SC: {
    label: 'Scrambler / Climber',
    widthLabel: '1-4 m',
    matureWidth: 2.5,
    matureHeight: 0.5,
    recommendedSpacing: 1.7,
    form: 'climber',
    canopyColor: '#7189bc',
  },
  LTG: {
    label: 'Large Tufted Grass',
    widthLabel: '0.8-2 m',
    matureWidth: 1.4,
    matureHeight: 1.4,
    recommendedSpacing: 1.1,
    form: 'grass',
    canopyColor: '#9caf59',
  },
  MNG: {
    label: 'Medium Non-tufted Grass',
    widthLabel: '0.3-1 m',
    matureWidth: 0.65,
    matureHeight: 0.7,
    recommendedSpacing: 0.5,
    form: 'grass',
    canopyColor: '#a6bc64',
  },
  LNG: {
    label: 'Large Non-tufted Grass',
    widthLabel: '0.8-2.5 m',
    matureWidth: 1.65,
    matureHeight: 1.6,
    recommendedSpacing: 1.25,
    form: 'grass',
    canopyColor: '#94aa54',
  },
  TTG: {
    label: 'Tiny Tufted Grass',
    widthLabel: '0.1-0.3 m',
    matureWidth: 0.2,
    matureHeight: 0.25,
    recommendedSpacing: 0.18,
    form: 'grass',
    canopyColor: '#b6c879',
  },
  HG: {
    label: 'Herbaceous Groundcover',
    widthLabel: '0.3-1.5 m',
    matureWidth: 0.9,
    matureHeight: 0.35,
    recommendedSpacing: 0.65,
    form: 'groundcover',
    canopyColor: '#a3cf8b',
  },
}

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

const LIMITED_DATA_MESSAGE =
  'No database plants available for this group yet. Due to current capability limits, the plant data we can access is limited; future partnerships with more comprehensive data sources may help fill this gap.'

const PLANTS_PER_PAGE = 4

function clampDim(raw: string, fallback: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.max(2, Math.min(60, n))
}

function spacingWarnings(placed: PlacedPlant[], specs: Record<string, AnySpec>): string[] {
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

function placedCounts(placed: PlacedPlant[], specs: Record<string, AnySpec>): FormCounts {
  return placed.reduce<FormCounts>(
    (counts, item) => {
      const spec = specs[item.specId]
      if (!spec) return counts
      if (isFeatureSpec(spec)) {
        counts.total += 1
        counts.features += 1
        if (spec.featureKind === 'nestBox') counts.nestBoxes += 1
        if (spec.featureKind === 'insectHotel') counts.insectHotels += 1
        if (spec.featureKind === 'rockPile' || spec.featureKind === 'logPile') {
          counts.groundShelters += 1
        }
        if (spec.featureKind === 'birdBath' || spec.featureKind === 'shallowDish') {
          counts.waterSources += 1
        }
        return counts
      }

      counts.total += 1
      if (spec.form === 'tree') counts.canopy += 1
      if (spec.form === 'shrub') counts.mid += 1
      if (spec.form === 'grass' || spec.form === 'groundcover' || spec.form === 'climber') counts.ground += 1
      if (spec.form === 'grass' || spec.form === 'groundcover' || spec.form === 'climber') counts.front += 1
      if (spec.form === 'tree' || spec.form === 'shrub') counts.back += 1

      return counts
    },
    {
      total: 0,
      canopy: 0,
      mid: 0,
      ground: 0,
      front: 0,
      back: 0,
      features: 0,
      nestBoxes: 0,
      insectHotels: 0,
      groundShelters: 0,
      waterSources: 0,
    },
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
    // 6 plant points (canopy 1 + mid 2 + ground 3) + 3 feature points
    // (nest box 1 + ground shelter 1 + water 1) = 9 total.
    const plantPts =
      Math.min(counts.canopy, 1) + Math.min(counts.mid, 2) + Math.min(counts.ground, 3)
    const featurePts =
      Math.min(counts.nestBoxes, 1) +
      Math.min(counts.groundShelters, 1) +
      Math.min(counts.waterSources, 1)
    return Math.round(((plantPts + featurePts) / 9) * 100)
  }
  if (goal === 'pollinator') {
    // 6 plant points (front 4 + back 2) + 3 feature points
    // (insect hotel 1 + log/rock shelter 1 + water 1) = 9 total.
    const plantPts = Math.min(counts.front, 4) + Math.min(counts.back, 2)
    const featurePts =
      Math.min(counts.insectHotels, 1) +
      Math.min(counts.groundShelters, 1) +
      Math.min(counts.waterSources, 1)
    return Math.round(((plantPts + featurePts) / 9) * 100)
  }
  return counts.total > 0 ? 100 : 0
}

function goalProgressItems(goal: GardenGoal, counts: FormCounts): ProgressItem[] {
  if (goal === 'bird') {
    const plantStructureDone =
      counts.canopy >= 1 && counts.mid >= 2 && counts.ground >= 3
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
        title: 'Nesting cavity',
        detail: `${counts.nestBoxes} nest box${counts.nestBoxes === 1 ? '' : 'es'} placed; aim for at least 1.`,
        state:
          counts.nestBoxes >= 1
            ? 'complete'
            : plantStructureDone
              ? 'active'
              : 'waiting',
      },
      {
        title: 'Ground shelter',
        detail: `${counts.groundShelters} rock or log pile${counts.groundShelters === 1 ? '' : 's'} placed; aim for at least 1.`,
        state:
          counts.groundShelters >= 1
            ? 'complete'
            : counts.nestBoxes >= 1
              ? 'active'
              : 'waiting',
      },
      {
        title: 'Water source',
        detail: `${counts.waterSources} bird bath or dish${counts.waterSources === 1 ? '' : 'es'} placed; aim for at least 1.`,
        state:
          counts.waterSources >= 1
            ? 'complete'
            : counts.groundShelters >= 1
              ? 'active'
              : 'waiting',
      },
      {
        title: 'Bird food traits',
        detail: 'Needs 2 fleshy-fruited or bird-dispersed species once database traits are connected.',
        state: plantStructureDone ? 'active' : 'waiting',
      },
    ]
  }

  if (goal === 'pollinator') {
    const plantStructureDone = counts.front >= 4 && counts.back >= 2
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
        title: 'Insect shelter',
        detail: `${counts.insectHotels} insect hotel${counts.insectHotels === 1 ? '' : 's'} placed; aim for at least 1.`,
        state:
          counts.insectHotels >= 1
            ? 'complete'
            : plantStructureDone
              ? 'active'
              : 'waiting',
      },
      {
        title: 'Ground / log shelter',
        detail: `${counts.groundShelters} rock or log pile${counts.groundShelters === 1 ? '' : 's'} placed; aim for at least 1 for ground-nesting bees.`,
        state:
          counts.groundShelters >= 1
            ? 'complete'
            : counts.insectHotels >= 1
              ? 'active'
              : 'waiting',
      },
      {
        title: 'Water source',
        detail: `${counts.waterSources} dish${counts.waterSources === 1 ? '' : 'es'} placed; a shallow dish with stones helps insects drink safely.`,
        state:
          counts.waterSources >= 1
            ? 'complete'
            : counts.groundShelters >= 1
              ? 'active'
              : 'waiting',
      },
      {
        title: 'Flowering seasons',
        detail: 'Needs at least 3 seasons with at least 3 species flowering in each covered season.',
        state: plantStructureDone ? 'active' : 'waiting',
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

function apiGoal(goal: GardenGoal): PlannerGoal | null {
  if (goal === 'bird' || goal === 'pollinator') return goal
  return null
}

function recommendationSpecId(plant: PlannerRecommendationPlant): string {
  return `db-${plant.id}`
}

function lfCodeProfile(lfCode: string | null): LfCodeProfile | null {
  if (!lfCode) return null
  return LF_CODE_PROFILES[lfCode.trim().toUpperCase()] ?? null
}

function hasGrowthForm(plant: PlannerRecommendationPlant, forms: string[]): boolean {
  return forms.some((form) => plant.growthForms.includes(form))
}

function recommendationForm(plant: PlannerRecommendationPlant, groupId: string): PlantForm {
  const profile = lfCodeProfile(plant.lfCode)
  if (profile) return profile.form

  if (groupId === 'canopy') return 'tree'
  if (groupId === 'mid') return 'shrub'
  if (groupId === 'back') {
    if (plant.lfCode === 'T' || hasGrowthForm(plant, ['tree', 'mallee'])) return 'tree'
    return 'shrub'
  }
  if (hasGrowthForm(plant, ['climber'])) return 'climber'
  if (hasGrowthForm(plant, ['graminoid', 'graminoid_not_tussock', 'tussock', 'hummock'])) return 'grass'
  if (hasGrowthForm(plant, ['shrub']) && (groupId === 'front' || groupId === 'ground')) return 'shrub'
  return 'groundcover'
}

function recommendationSpec(plant: PlannerRecommendationPlant, groupId: string): PlantSpec {
  const form = recommendationForm(plant, groupId)
  const commonName = plant.commonName || plant.scientificName || 'Recommended plant'
  const fallbackDims: Record<PlantForm, Pick<PlantSpec, 'matureWidth' | 'matureHeight' | 'recommendedSpacing' | 'canopyColor'>> = {
    tree: { matureWidth: 4, matureHeight: 8, recommendedSpacing: 4, canopyColor: '#4f7f3b' },
    shrub: { matureWidth: 2, matureHeight: 2, recommendedSpacing: 1.8, canopyColor: '#789b4f' },
    grass: { matureWidth: 0.8, matureHeight: 1, recommendedSpacing: 0.6, canopyColor: '#a6bc64' },
    groundcover: { matureWidth: 0.8, matureHeight: 0.35, recommendedSpacing: 0.55, canopyColor: '#9ccf84' },
    climber: { matureWidth: 1.8, matureHeight: 0.4, recommendedSpacing: 1.2, canopyColor: '#7189bc' },
  }
  const profile = lfCodeProfile(plant.lfCode)
  const dims = profile ?? fallbackDims[form]

  return {
    id: recommendationSpecId(plant),
    commonName,
    scientificName: plant.scientificName || commonName,
    form,
    sun: 'full',
    note: plant.reason,
    matureWidth: dims.matureWidth,
    matureHeight: dims.matureHeight,
    recommendedSpacing: dims.recommendedSpacing,
    canopyColor: dims.canopyColor,
  }
}

function recommendationMeta(plant: PlannerRecommendationPlant): string {
  const bits = []
  const profile = lfCodeProfile(plant.lfCode)
  if (plant.lfCode) {
    bits.push(profile ? `LF ${plant.lfCode}: ${profile.widthLabel} mature width` : `LF ${plant.lfCode}`)
  }
  if (plant.floweringSeasons.length > 0) bits.push(`${plant.floweringSeasons.join(', ')} flowering`)
  if (plant.growthForms.length > 0) bits.push(plant.growthForms.slice(0, 2).join(', '))
  return bits.join(' · ')
}

/** Which feature kinds are explicit targets for each garden goal. */
const GOAL_FEATURE_TARGETS: Record<GardenGoal, string[]> = {
  free: [],
  bird: ['nestBox', 'rockPile', 'logPile', 'birdBath', 'shallowDish'],
  pollinator: ['insectHotel', 'logPile', 'rockPile', 'shallowDish'],
}

function featureRecommendedForGoal(kind: string, goal: GardenGoal): boolean {
  return GOAL_FEATURE_TARGETS[goal].includes(kind)
}

function featureGoalNote(goal: GardenGoal): string | null {
  if (goal === 'bird') {
    return 'Bird-friendly target: at least 1 nest box, 1 rock or log pile, and 1 water source.'
  }
  if (goal === 'pollinator') {
    return 'Pollinator target: at least 1 insect hotel, 1 log/rock pile, and 1 shallow water dish.'
  }
  return null
}

function recommendationGroupById(
  data: PlannerRecommendationsResponse | null,
): Record<string, PlannerRecommendationGroup> {
  const out: Record<string, PlannerRecommendationGroup> = {}
  data?.groups.forEach((group) => {
    out[group.id] = group
  })
  return out
}

export function GardenPlannerPage() {
  const { coords, areaLabel } = useLocationArea()
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
  const [dbSpecsById, setDbSpecsById] = useState<Record<string, PlantSpec>>({})
  const [plannerRecommendations, setPlannerRecommendations] =
    useState<PlannerRecommendationsResponse | null>(null)
  const [plannerLoading, setPlannerLoading] = useState(false)
  const [plannerError, setPlannerError] = useState<string | null>(null)
  const [groupPages, setGroupPages] = useState<Record<string, number>>({})
  const [catalogTab, setCatalogTab] = useState<'plants' | 'features'>('plants')
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null)

  const { state: authState } = useAuth()
  const layoutHydratedRef = useRef(false)
  const [layoutRemote, setLayoutRemote] = useState<
    'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'skipped'
  >('idle')

  const localSpecsById = useMemo(() => {
    const m: Record<string, PlantSpec> = {}
    PLANT_SPECS.forEach((p) => {
      m[p.id] = p
    })
    return m
  }, [])

  const featureSpecsById = useMemo(() => {
    const m: Record<string, FeatureSpec> = {}
    FEATURE_SPECS.forEach((f) => {
      m[f.id] = f
    })
    return m
  }, [])

  const featuresByCategory = useMemo(() => {
    const m: Record<FeatureCategory, FeatureSpec[]> = { shelter: [], water: [] }
    FEATURE_SPECS.forEach((f) => {
      m[f.category].push(f)
    })
    return m
  }, [])

  const specsById = useMemo<Record<string, AnySpec>>(
    () => ({ ...localSpecsById, ...featureSpecsById, ...dbSpecsById }),
    [localSpecsById, featureSpecsById, dbSpecsById],
  )

  const specsPatchForSave = useMemo(
    () => plannerSpecsPatchForSave(placed, specsById),
    [placed, specsById],
  )

  const layoutPayloadForSave = useMemo((): PlannerLayoutPayloadV1 => {
    const payload: PlannerLayoutPayloadV1 = {
      version: 1,
      widthStr,
      depthStr,
      goal,
      viewMode,
      placed,
    }
    if (specsPatchForSave) payload.specsPatch = specsPatchForSave
    return payload
  }, [widthStr, depthStr, goal, viewMode, placed, specsPatchForSave])

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
  const currentApiGoal = apiGoal(goal)
  const recommendationGroups = useMemo(
    () => recommendationGroupById(plannerRecommendations),
    [plannerRecommendations],
  )

  useEffect(() => {
    if (!currentApiGoal) {
      queueMicrotask(() => {
        setPlannerRecommendations(null)
        setPlannerLoading(false)
        setPlannerError(null)
        setGroupPages({})
      })
      return
    }

    if (!coords) {
      queueMicrotask(() => {
        setPlannerRecommendations(null)
        setPlannerLoading(false)
        setPlannerError(null)
        setGroupPages({})
      })
      return
    }

    const ac = new AbortController()
    queueMicrotask(() => {
      if (ac.signal.aborted) return
      setPlannerLoading(true)
      setPlannerError(null)
    })
    fetchPlannerRecommendations(currentApiGoal, coords.lat, coords.lng, ac.signal)
      .then((data) => {
        if (!ac.signal.aborted) {
          setPlannerRecommendations(data)
          setGroupPages({})
        }
      })
      .catch((error) => {
        if (ac.signal.aborted) return
        setPlannerRecommendations(null)
        setPlannerError(error instanceof Error ? error.message : 'Could not load planner recommendations')
      })
      .finally(() => {
        if (!ac.signal.aborted) setPlannerLoading(false)
      })

    return () => ac.abort()
  }, [currentApiGoal, coords])

  useEffect(() => {
    layoutHydratedRef.current = false
    if (!isFirebaseAuthConfigured()) {
      queueMicrotask(() => {
        layoutHydratedRef.current = true
        setLayoutRemote('skipped')
      })
      return
    }
    if (authState.loading) return
    const user = authState.configured ? authState.user : null
    if (!user) {
      queueMicrotask(() => {
        layoutHydratedRef.current = true
      })
      return
    }

    let cancelled = false
    let loadOk = false
    const ac = new AbortController()
    queueMicrotask(() => {
      if (cancelled) return
      setLayoutRemote('loading')
      void fetchPlannerLayoutFromApi(ac.signal)
        .then(({ layout }) => {
          if (cancelled) return
          loadOk = true
          if (!layout) return
          setWidthStr(layout.widthStr)
          setDepthStr(layout.depthStr)
          setGoal(layout.goal)
          setViewMode(layout.viewMode)
          setPlaced(layout.placed)
          if (layout.specsPatch) {
            setDbSpecsById((prev) => ({ ...prev, ...layout.specsPatch }))
          }
        })
        .catch(() => {
          if (!cancelled) setLayoutRemote('error')
        })
        .finally(() => {
          if (!cancelled && loadOk) {
            layoutHydratedRef.current = true
            setLayoutRemote('idle')
          }
          // on error: layoutHydratedRef stays false so the save effect stays blocked
        })
    })
    return () => {
      cancelled = true
      ac.abort()
    }
  }, [authState.loading, authState.configured, authState.user])

  useEffect(() => {
    if (!isFirebaseAuthConfigured()) return
    if (!authState.configured || !authState.user || !layoutHydratedRef.current) return

    const ac = new AbortController()
    const t = window.setTimeout(() => {
      setLayoutRemote((prev) => (prev === 'loading' ? prev : 'saving'))
      void savePlannerLayoutToApi(layoutPayloadForSave, ac.signal)
        .then(() => {
          if (ac.signal.aborted) return
          setLayoutRemote('saved')
          window.setTimeout(() => {
            setLayoutRemote((prev) => (prev === 'saved' ? 'idle' : prev))
          }, 2200)
        })
        .catch((err: unknown) => {
          if (ac.signal.aborted) return
          const name = err instanceof Error ? err.name : ''
          if (name === 'AbortError') return
          setLayoutRemote('error')
        })
    }, 1400)

    return () => {
      window.clearTimeout(t)
      ac.abort()
    }
  }, [layoutPayloadForSave, authState.configured, authState.user])

  const handleGoalChange = (nextGoal: GardenGoal) => {
    setGoal(nextGoal)
    setSearch('')
    setPendingSpecId(null)
  }

  const handleRecommendationSelect = (plant: PlannerRecommendationPlant, groupId: string) => {
    const spec = recommendationSpec(plant, groupId)
    setDbSpecsById((current) => ({ ...current, [spec.id]: spec }))
    setPendingSpecId((current) => (current === spec.id ? null : spec.id))
  }

  const setGroupPage = (groupId: string, page: number) => {
    setGroupPages((current) => ({ ...current, [groupId]: page }))
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

  const layoutSyncCaption =
    layoutRemote === 'skipped'
      ? 'Sign in to sync your layout to the cloud.'
      : layoutRemote === 'loading'
        ? 'Loading your saved layout…'
        : layoutRemote === 'saving'
          ? 'Saving layout…'
          : layoutRemote === 'saved'
            ? 'Layout saved.'
            : layoutRemote === 'error'
              ? 'Could not load your layout — saves are paused. Refresh to retry.'
              : null

  return (
    <div className="garden-planner-page">
      <header className="page-header">
        <p className="eyebrow">Plan</p>
        <h1>Garden planner</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Build a planting layout around a habitat goal, then use the planner to test spacing and
          structure before the database-backed recommendations are connected.
        </p>
        {layoutSyncCaption ? (
          <p
            role="status"
            aria-live="polite"
            style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}
          >
            {layoutSyncCaption}
          </p>
        ) : null}
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
          <h2 className="garden-planner-panel-title">
            {goal === 'free' ? 'Catalog' : 'Goal recommendations'}
          </h2>
          <div
            className="planner-catalog-tabs"
            role="tablist"
            aria-label="Catalog category"
          >
            <button
              type="button"
              role="tab"
              className={`planner-catalog-tab${catalogTab === 'plants' ? ' active' : ''}`}
              aria-selected={catalogTab === 'plants'}
              onClick={() => setCatalogTab('plants')}
            >
              Plants
            </button>
            <button
              type="button"
              role="tab"
              className={`planner-catalog-tab${catalogTab === 'features' ? ' active' : ''}`}
              aria-selected={catalogTab === 'features'}
              onClick={() => setCatalogTab('features')}
            >
              Features
            </button>
          </div>

          {catalogTab === 'features' ? (
            <>
              {featureGoalNote(goal) && (
                <p className="garden-planner-sidebar-note">{featureGoalNote(goal)}</p>
              )}
              <div className="planner-feature-catalog">
                {FEATURE_CATEGORY_ORDER.map((cat) => {
                  const items = featuresByCategory[cat]
                  if (items.length === 0) return null
                  return (
                    <div key={cat} className="planner-feature-group">
                      <h3 className="planner-feature-group__title">
                        {FEATURE_CATEGORY_LABEL[cat]}
                      </h3>
                      <ul className="planner-feature-list">
                        {items.map((f) => {
                          const active = pendingSpecId === f.id
                          const recommended = featureRecommendedForGoal(f.featureKind, goal)
                          const expanded = expandedFeatureId === f.id
                          return (
                            <li key={f.id} className="planner-feature-list__item">
                              <div className="planner-feature-item-wrap">
                                <button
                                  type="button"
                                  className={`planner-feature-item${active ? ' active' : ''}${recommended ? ' recommended' : ''}${expanded ? ' expanded' : ''}`}
                                  onClick={() =>
                                    setPendingSpecId(active ? null : f.id)
                                  }
                                  aria-pressed={active}
                                  title={f.sizeLabel}
                                >
                                  <span
                                    className="planner-feature-item__icon"
                                    style={{ color: f.primaryColor }}
                                    aria-hidden
                                  >
                                    <FeatureIcon kind={f.featureKind} />
                                  </span>
                                  <span className="planner-feature-item__text">
                                    <span className="planner-feature-item__name">
                                      {f.commonName}
                                      {recommended && (
                                        <span className="planner-feature-item__badge">
                                          Recommended
                                        </span>
                                      )}
                                    </span>
                                    <span className="planner-feature-item__desc">
                                      {f.description}
                                    </span>
                                  </span>
                                </button>
                                {f.info && (
                                  <button
                                    type="button"
                                    className={`planner-feature-info-toggle${expanded ? ' active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedFeatureId(expanded ? null : f.id)
                                    }}
                                    aria-expanded={expanded}
                                    aria-controls={`feature-info-${f.id}`}
                                    aria-label={`${expanded ? 'Collapse' : 'Show'} details for ${f.commonName}`}
                                  >
                                    i
                                  </button>
                                )}
                              </div>
                              {expanded && f.info && (
                                <div
                                  className="planner-feature-details"
                                  id={`feature-info-${f.id}`}
                                  role="region"
                                  aria-label={`${f.commonName} details`}
                                >
                                  <p className="planner-feature-details__intro">
                                    {f.info.introParts.map((part, idx) =>
                                      part.bold ? (
                                        <strong key={idx}>{part.text}</strong>
                                      ) : (
                                        <span key={idx}>{part.text}</span>
                                      ),
                                    )}
                                  </p>
                                  <div className="planner-feature-details__stat">
                                    <span className="planner-feature-details__stat-num">
                                      {f.info.stat}
                                    </span>
                                    <span className="planner-feature-details__stat-cap">
                                      {f.info.statCaption}
                                    </span>
                                  </div>
                                  <p className="planner-feature-details__tips-title">
                                    Placement tips
                                  </p>
                                  <ul className="planner-feature-details__tips">
                                    {f.info.placementTips.map((tip) => (
                                      <li key={tip}>{tip}</li>
                                    ))}
                                  </ul>
                                  <p className="planner-feature-details__footer">
                                    {f.info.footer}
                                  </p>
                                  {f.info.links && f.info.links.length > 0 && (
                                    <ul className="planner-feature-details__links">
                                      {f.info.links.map((link) => (
                                        <li key={link.url}>
                                          <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                          >
                                            {link.label}
                                          </a>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  <button
                                    type="button"
                                    className="planner-feature-details__collapse"
                                    onClick={() => setExpandedFeatureId(null)}
                                  >
                                    Collapse ↑
                                  </button>
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </>
          ) : goal === 'free' ? (
            <>
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
              <p className="garden-planner-sidebar-note">
                {plannerLoading
                  ? 'Loading database-matched recommendations...'
                  : plannerError
                    ? plannerError
                    : coords
                      ? `Matched to ${plannerRecommendations?.regionName ?? areaLabel}. Click a species to place it.`
                      : 'Set a Victorian location first so the planner can match your bioregion.'}
              </p>
              <ul className="garden-goal-catalog">
                {goalGroups.map((group) => {
                  const isActive = group.id === currentActiveGroupId
                  const dbGroup = recommendationGroups[group.id]
                  const plants = dbGroup?.plants ?? []
                  const pageSize = Math.max(PLANTS_PER_PAGE, group.slots)
                  const totalPages = Math.max(1, Math.ceil(plants.length / pageSize))
                  const currentPage = Math.min(
                    Math.max(groupPages[group.id] ?? 0, 0),
                    totalPages - 1,
                  )
                  const pageStart = currentPage * pageSize
                  const pagePlants = plants.slice(pageStart, pageStart + pageSize)
                  const isPaged = totalPages > 1
                  const slotCount = isPaged
                    ? pagePlants.length
                    : Math.max(group.slots, plants.length, dbGroup?.requiredCount ?? 0)
                  const renderedPlants = isPaged ? pagePlants : plants
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
                        <span>
                          {dbGroup
                            ? `${plants.length} available`
                            : groupStatusText(goal, group.id, counts)}
                        </span>
                      </div>
                      <p className="garden-goal-catalog__description">
                        {dbGroup?.reason ?? group.description}
                      </p>
                      <div className="garden-goal-catalog__criteria" aria-label={`${group.title} criteria`}>
                        {group.criteria.map((criterion) => (
                          <span key={criterion}>{criterion}</span>
                        ))}
                      </div>
                      <div className="garden-goal-slots" aria-label={`${group.title} recommendation slots`}>
                        {dbGroup && plants.length === 0 ? (
                          <p className="garden-goal-slots__limited">{LIMITED_DATA_MESSAGE}</p>
                        ) : (
                          Array.from({ length: slotCount }, (_, index) => {
                            const plant = renderedPlants[index]
                            if (!plant) {
                              return (
                                <span key={index} className="garden-goal-slots__empty">
                                  {plannerLoading
                                    ? 'Loading...'
                                    : plannerError
                                      ? 'Recommendation unavailable'
                                      : coords
                                        ? `Species slot ${index + 1}`
                                        : 'Location needed'}
                                </span>
                              )
                            }
                            const active = pendingSpecId === recommendationSpecId(plant)
                            return (
                              <button
                                key={plant.id}
                                type="button"
                                className={`garden-goal-slots__plant${active ? ' active' : ''}`}
                                onClick={() => handleRecommendationSelect(plant, group.id)}
                                aria-pressed={active}
                              >
                                <span className="garden-goal-slots__plant-name">
                                  {plant.commonName || plant.scientificName}
                                </span>
                                {plant.commonName && (
                                  <span className="garden-goal-slots__plant-sci">{plant.scientificName}</span>
                                )}
                                <span className="garden-goal-slots__plant-meta">
                                  {recommendationMeta(plant) || 'Database recommendation'}
                                </span>
                                <span className="garden-goal-slots__plant-reason">{plant.reason}</span>
                              </button>
                            )
                          })
                        )}
                      </div>
                      {isPaged && (
                        <nav
                          className="garden-goal-pagination"
                          aria-label={`${group.title} pagination`}
                        >
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setGroupPage(group.id, currentPage - 1)}
                            disabled={currentPage === 0}
                            aria-label={`Previous ${group.title} page`}
                          >
                            Prev
                          </button>
                          <span className="garden-goal-pagination__status" aria-live="polite">
                            Page {currentPage + 1} of {totalPages}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => setGroupPage(group.id, currentPage + 1)}
                            disabled={currentPage >= totalPages - 1}
                            aria-label={`Next ${group.title} page`}
                          >
                            Next
                          </button>
                        </nav>
                      )}
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
          {pendingSpec && isFeatureSpec(pendingSpec) ? (
            <div className="planner-feature-banner" role="status">
              <span className="planner-feature-banner__bullet" aria-hidden>!</span>
              <div className="planner-feature-banner__body">
                <p className="planner-feature-banner__title">
                  Placing {pendingSpec.commonName.toLowerCase().startsWith('a') ||
                  pendingSpec.commonName.toLowerCase().startsWith('e') ||
                  pendingSpec.commonName.toLowerCase().startsWith('i') ||
                  pendingSpec.commonName.toLowerCase().startsWith('o') ||
                  pendingSpec.commonName.toLowerCase().startsWith('u')
                    ? 'an'
                    : 'a'}{' '}
                  {pendingSpec.commonName}
                </p>
                <p className="planner-feature-banner__detail">
                  {pendingSpec.placementNote}
                </p>
                <p className="planner-feature-banner__meta">{pendingSpec.sizeLabel}</p>
              </div>
              <button
                type="button"
                className="planner-feature-banner__more"
                onClick={() => {
                  setCatalogTab('features')
                  setExpandedFeatureId(pendingSpec.id)
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById(`feature-info-${pendingSpec.id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  })
                }}
              >
                Learn more →
              </button>
            </div>
          ) : (
            <div className="garden-planner-hint">
              {pendingSpec ? (
                <>
                  Placing <strong>{pendingSpec.commonName}</strong> - click inside the garden.
                  Footprint will be <strong>{pendingSpec.matureWidth.toFixed(1)} m</strong> wide
                  (minimum spacing ≈ {pendingSpec.recommendedSpacing.toFixed(1)} m).
                  {!isFeatureSpec(pendingSpec) && pendingSpec.note ? <> {pendingSpec.note}</> : null}
                </>
              ) : goal === 'free' ? (
                <>Left-drag to rotate · right-drag to pan · scroll to zoom · click a plant in the catalog to start placing.</>
              ) : plannerLoading ? (
                <>Loading database recommendations for this garden goal.</>
              ) : !coords ? (
                <>Set a Victorian location to load goal-based species recommendations.</>
              ) : plannerError ? (
                <>Could not load goal recommendations: {plannerError}</>
              ) : (
                <>Click a recommended species on the left, then click inside the garden to place it.</>
              )}
            </div>
          )}
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
                <dt>Location</dt>
                <dd>{plannerRecommendations?.regionName ?? areaLabel}</dd>
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
                  const typeLabel = isFeatureSpec(s)
                    ? FEATURE_CATEGORY_LABEL[s.category]
                    : FORM_LABEL[s.form]
                  return (
                    <li key={p.uid}>
                      <span>
                        <strong>{s.commonName}</strong>
                        <small>
                          {typeLabel} · {p.x.toFixed(1)} m, {p.z.toFixed(1)} m
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
