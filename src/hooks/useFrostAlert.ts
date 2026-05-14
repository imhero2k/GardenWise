import { useEffect, useMemo, useState } from 'react'
import { fetchFrostForecast, type FrostWindow } from '../lib/weather'

export type FrostAlertState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'clear' }
  | { status: 'frost'; data: FrostWindow }
  | { status: 'error' }

const DISMISS_KEY = 'rootvio-frost-dismiss-v1'
const CACHE_KEY = 'rootvio-frost-cache-v1'
const CACHE_TTL_MS = 60 * 60 * 1000

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY)
  } catch {
    return null
  }
}

function readCache(): FrostWindow | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ts: number; data: FrostWindow }
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: FrostWindow | null) {
  try {
    if (data) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
    } else {
      localStorage.removeItem(CACHE_KEY)
    }
  } catch { /* ignore */ }
}

function initState(lat: number | null, lng: number | null): FrostAlertState {
  if (lat == null || lng == null) return { status: 'idle' }
  const cached = readCache()
  if (cached) return { status: 'frost', data: cached }
  return { status: 'idle' }
}

export function useFrostAlert(lat: number | null, lng: number | null) {
  const [state, setState] = useState<FrostAlertState>(() => initState(lat, lng))
  const [dismissed, setDismissed] = useState(() => {
    const s = initState(lat, lng)
    if (s.status === 'frost') return readDismissed() === s.data.startsAt
    return false
  })

  useEffect(() => {
    if (lat == null || lng == null) return

    const cached = readCache()
    if (cached) return

    const ac = new AbortController()
    queueMicrotask(() => {
      if (!ac.signal.aborted) setState({ status: 'loading' })
    })

    fetchFrostForecast(lat, lng, ac.signal)
      .then((result) => {
        if (ac.signal.aborted) return
        if (result) {
          writeCache(result)
          setState({ status: 'frost', data: result })
        } else {
          writeCache(null)
          setState({ status: 'clear' })
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setState({ status: 'error' })
      })

    return () => ac.abort()
  }, [lat, lng])

  const isDismissed = useMemo(() => {
    if (dismissed) return true
    if (state.status !== 'frost') return false
    return readDismissed() === state.data.startsAt
  }, [dismissed, state])

  const dismiss = () => {
    if (state.status === 'frost') {
      try {
        localStorage.setItem(DISMISS_KEY, state.data.startsAt)
      } catch { /* ignore */ }
    }
    setDismissed(true)
  }

  return { state, dismissed: isDismissed, dismiss }
}
