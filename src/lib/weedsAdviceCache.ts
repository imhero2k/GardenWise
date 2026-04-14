/**
 * Temporary browser storage for Weeds Australia management advice (sessionStorage).
 * Survives reloads in the same tab; cleared when the tab closes. Use for cross-page
 * reuse or to combine with local keyword matching without re-fetching ALA.
 */

import type { WeedsManagementAdvice } from './alaWeedsProfile'

const PREFIX = 'gardenwise.weedsAdvice.v1:'
const DEFAULT_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour — treat as stale and re-fetch after

type CachedPayload = {
  advice: WeedsManagementAdvice
  cachedAt: number
}

function key(scientificName: string): string {
  return `${PREFIX}${scientificName.trim().toLowerCase()}`
}

export function getCachedWeedsManagementAdvice(
  scientificName: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): WeedsManagementAdvice | null {
  try {
    const raw = sessionStorage.getItem(key(scientificName))
    if (!raw) return null
    const p = JSON.parse(raw) as CachedPayload
    if (!p?.advice || typeof p.cachedAt !== 'number') return null
    if (Date.now() - p.cachedAt > maxAgeMs) {
      sessionStorage.removeItem(key(scientificName))
      return null
    }
    return p.advice
  } catch {
    return null
  }
}

export function setCachedWeedsManagementAdvice(
  scientificName: string,
  advice: WeedsManagementAdvice,
): void {
  try {
    const payload: CachedPayload = { advice, cachedAt: Date.now() }
    sessionStorage.setItem(key(scientificName), JSON.stringify(payload))
  } catch {
    // quota / private mode — ignore
  }
}

export function clearCachedWeedsManagementAdvice(scientificName?: string): void {
  try {
    if (scientificName) sessionStorage.removeItem(key(scientificName))
    else {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i)
        if (k?.startsWith(PREFIX)) sessionStorage.removeItem(k)
      }
    }
  } catch {
    /* ignore */
  }
}
