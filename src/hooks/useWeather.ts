import { useEffect, useState } from 'react'
import { fetchCurrentWeather, type CurrentWeather } from '../lib/weather'

export type WeatherFetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: CurrentWeather }
  | { status: 'error' }

export function useWeather(lat: number | null, lng: number | null): WeatherFetchState {
  const [state, setState] = useState<WeatherFetchState>({ status: 'idle' })

  useEffect(() => {
    if (lat == null || lng == null) {
      return
    }

    const ac = new AbortController()
    queueMicrotask(() => {
      if (!ac.signal.aborted) setState({ status: 'loading' })
    })

    fetchCurrentWeather(lat, lng, ac.signal)
      .then((data) => {
        setState({ status: 'ok', data })
      })
      .catch(() => {
        if (!ac.signal.aborted) setState({ status: 'error' })
      })

    return () => ac.abort()
  }, [lat, lng])

  if (lat == null || lng == null) {
    return { status: 'idle' }
  }

  return state
}
