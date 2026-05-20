import { useEffect, useMemo, useState } from 'react'
import { fetchFrostForecast, fetchHeatForecast, type FrostWindow, type HeatWindow } from '../lib/weather'

/** How long a cached forecast stays valid in localStorage (1 hour). */
const CACHE_TTL_MS = 60 * 60 * 1000

type AlertVariant = 'frost' | 'heat'

type IdleState = { status: 'idle' }
type LoadingState = { status: 'loading' }
type ClearState = { status: 'clear' }
type ErrorState = { status: 'error' }

export type FrostAlertState =
  | IdleState
  | LoadingState
  | ClearState
  | { status: 'frost'; data: FrostWindow }
  | ErrorState

export type HeatAlertState =
  | IdleState
  | LoadingState
  | ClearState
  | { status: 'heat'; data: HeatWindow }
  | ErrorState

type AnyAlertState = FrostAlertState | HeatAlertState

/**
 * Per-variant settings. Frost and heat share the same hook logic but use
 * different API helpers, localStorage keys, and active status names.
 */
const CONFIG = {
  frost: {
    activeStatus: 'frost' as const,
    dismissKey: 'rootvio-frost-dismiss-v1',
    cacheKey: 'rootvio-frost-cache-v1',
    fetch: fetchFrostForecast,
  },
  heat: {
    activeStatus: 'heat' as const,
    dismissKey: 'rootvio-heat-dismiss-v1',
    cacheKey: 'rootvio-heat-cache-v1',
    fetch: fetchHeatForecast,
  },
} satisfies Record<AlertVariant, {
  activeStatus: AlertVariant
  dismissKey: string
  cacheKey: string
  fetch: (lat: number, lng: number, signal?: AbortSignal) => Promise<FrostWindow | HeatWindow | null>
}>

function readDismissed(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Read a cached alert window if it is still within CACHE_TTL_MS. */
function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: T }
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T | null) {
  try {
    if (data) {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }))
    } else {
      localStorage.removeItem(key)
    }
  } catch { /* ignore */ }
}

/** Initial state: idle without coords, or replay a valid cache hit. */
function initState(variant: AlertVariant, lat: number | null, lng: number | null): AnyAlertState {
  const { activeStatus, cacheKey } = CONFIG[variant]
  if (lat == null || lng == null) return { status: 'idle' }
  const cached = readCache<FrostWindow | HeatWindow>(cacheKey)
  if (cached) return { status: activeStatus, data: cached }
  return { status: 'idle' }
}

/**
 * Shared hook for frost and heat alerts.
 *
 * @param variant - `'frost'` or `'heat'`
 * @param lat - latitude from useWeatherCoords (null hides the alert)
 * @param lng - longitude from useWeatherCoords
 *
 * Returns `{ state, dismissed, dismiss }`:
 * - `state.status` is `'frost'` / `'heat'` when an alert is active, `'clear'` when none, etc.
 * - `dismissed` is true if the user dismissed this specific forecast window (`startsAt`)
 * - `dismiss()` hides the banner until the next forecast window
 */
export function useTemperatureAlert(variant: AlertVariant, lat: number | null, lng: number | null) {
  const { activeStatus, dismissKey, cacheKey, fetch } = CONFIG[variant]

  const [state, setState] = useState<AnyAlertState>(() => initState(variant, lat, lng))
  const [dismissed, setDismissed] = useState(() => {
    const s = initState(variant, lat, lng)
    if (s.status === activeStatus) return readDismissed(dismissKey) === s.data.startsAt
    return false
  })

  useEffect(() => {
    if (lat == null || lng == null) return
    // Skip network if we already have a fresh cache entry for this variant.
    if (readCache(cacheKey)) return

    const ac = new AbortController()
    queueMicrotask(() => {
      if (!ac.signal.aborted) setState({ status: 'loading' })
    })

    fetch(lat, lng, ac.signal)
      .then((result) => {
        if (ac.signal.aborted) return
        if (result) {
          writeCache(cacheKey, result)
          setState({ status: activeStatus, data: result })
        } else {
          writeCache(cacheKey, null)
          setState({ status: 'clear' })
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setState({ status: 'error' })
      })

    return () => ac.abort()
  }, [variant, lat, lng, activeStatus, cacheKey, fetch])

  const isDismissed = useMemo(() => {
    if (dismissed) return true
    if (state.status !== activeStatus) return false
    // Dismiss is keyed to startsAt so a new forecast window shows again.
    return readDismissed(dismissKey) === state.data.startsAt
  }, [dismissed, state, activeStatus, dismissKey])

  const dismiss = () => {
    if (state.status === activeStatus) {
      try {
        localStorage.setItem(dismissKey, state.data.startsAt)
      } catch { /* ignore */ }
    }
    setDismissed(true)
  }

  return { state, dismissed: isDismissed, dismiss }
}

/** Convenience wrapper — same as useTemperatureAlert('frost', lat, lng). */
export function useFrostAlert(lat: number | null, lng: number | null) {
  return useTemperatureAlert('frost', lat, lng)
}

/** Convenience wrapper — same as useTemperatureAlert('heat', lat, lng). */
export function useHeatAlert(lat: number | null, lng: number | null) {
  return useTemperatureAlert('heat', lat, lng)
}
