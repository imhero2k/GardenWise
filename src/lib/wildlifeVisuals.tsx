/**
 * Shared visual mapping for the "Attracts wildlife" feature. One source of
 * truth so the filter chips on PlantMe and the per-plant detail dialog use
 * the same icon and accent color for each wildlife category.
 *
 * The detail dialog receives free-form group names from the backend (e.g.
 * "Honeyeaters", "Native bees", "Possums"), so `matchWildlifeType` does a
 * forgiving case-insensitive substring match against a small synonym list
 * before falling back to a generic icon.
 */
import type { ReactElement } from 'react'
import { IconBird, IconInsect, IconMammal } from '../components/Icons'
import type { WildlifeCategory } from './recommendationsApi'

export type WildlifeVisual = {
  Icon: (props: { className?: string; size?: number }) => ReactElement
  /** Color used to tint the icon so categories stay recognizable even
   * inside an "active" chip whose background already carries the brand
   * green. Picked to read clearly on the app's light surface palette. */
  color: string
  label: string
}

export const WILDLIFE_VISUALS: Record<
  WildlifeCategory,
  WildlifeVisual & { tagline: string; examples: string }
> = {
  birds: {
    Icon: IconBird,
    color: '#1d4ed8',
    label: 'Birds',
    tagline: 'Songbirds & honeyeaters',
    examples: 'Nectar, seeds, safe perches',
  },
  insects: {
    Icon: IconInsect,
    color: '#b45309',
    label: 'Insects',
    tagline: 'Bees & butterflies',
    examples: 'Pollen-rich native flowers',
  },
  mammals: {
    Icon: IconMammal,
    color: '#92400e',
    label: 'Mammals',
    tagline: 'Possums & gliders',
    examples: 'Shelter, night foraging',
  },
}

const SYNONYMS: ReadonlyArray<{ category: WildlifeCategory; needles: string[] }> = [
  {
    category: 'birds',
    needles: ['bird', 'honeyeater', 'parrot', 'finch', 'wren', 'lorikeet'],
  },
  {
    category: 'insects',
    needles: [
      'insect',
      'bee',
      'butterfly',
      'moth',
      'wasp',
      'beetle',
      'pollinator',
    ],
  },
  {
    category: 'mammals',
    needles: ['mammal', 'possum', 'koala', 'bat', 'glider', 'wallaby', 'kangaroo'],
  },
]

/**
 * Best-effort match from a free-form group name to a known category. Returns
 * `null` when nothing fits so callers can render a neutral fallback.
 */
export function matchWildlifeType(type: string): WildlifeCategory | null {
  const t = type.toLowerCase()
  for (const { category, needles } of SYNONYMS) {
    if (needles.some((n) => t.includes(n))) return category
  }
  return null
}

/**
 * Convenience accessor — resolves a free-form group label to its visual or
 * returns `null` so callers can opt out of rendering an icon.
 */
export function visualForType(type: string): WildlifeVisual | null {
  const cat = matchWildlifeType(type)
  return cat ? WILDLIFE_VISUALS[cat] : null
}
