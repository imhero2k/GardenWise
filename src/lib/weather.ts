/** WMO codes from Open-Meteo — map to simple icon buckets. */
export type WeatherKind = 'sunny' | 'cloudy' | 'rainy'

export type WeatherProvider = 'google' | 'openmeteo'

export interface CurrentWeather {
  tempC: number
  kind: WeatherKind
  provider: WeatherProvider
  /** Google-hosted icon when using Maps Weather API */
  iconUrl?: string
}

export interface FrostWindow {
  /** ISO-8601 hour the frost is expected to start (earliest hour <= threshold) */
  startsAt: string
  /** Lowest forecast temperature in the next 24 h */
  minTempC: number
  /** Hours from now until the frost window begins */
  hoursUntil: number
  provider: WeatherProvider
}

export interface HeatWindow {
  /** ISO-8601 hour heat is expected to start (earliest hour above threshold) */
  startsAt: string
  /** Highest forecast temperature in the next 24 h */
  maxTempC: number
  /** Hours from now until the hot period begins */
  hoursUntil: number
  provider: WeatherProvider
}

function getGoogleApiKey(): string | undefined {
  const k = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return typeof k === 'string' && k.trim() ? k.trim() : undefined
}

/** Maps Google WeatherCondition.type to our three buckets. */
export function googleConditionTypeToKind(type: string): WeatherKind {
  const t = type.toUpperCase()
  if (t === 'CLEAR' || t === 'MOSTLY_CLEAR') return 'sunny'
  if (
    t.includes('RAIN') ||
    t.includes('SNOW') ||
    t.includes('HAIL') ||
    t.includes('THUNDER') ||
    t.includes('SHOWER')
  ) {
    return 'rainy'
  }
  return 'cloudy'
}

export function classifyWeatherCode(code: number): WeatherKind {
  if (code === 0) return 'sunny'
  if (code === 1) return 'sunny'
  if (code >= 51 && code <= 67) return 'rainy'
  if (code >= 80 && code <= 82) return 'rainy'
  if (code >= 95 && code <= 99) return 'rainy'
  if (code >= 2 && code <= 48) return 'cloudy'
  if (code >= 71 && code <= 77) return 'cloudy'
  if (code >= 85 && code <= 86) return 'cloudy'
  return 'cloudy'
}

async function fetchOpenMeteo(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const u = new URL('https://api.open-meteo.com/v1/forecast')
  u.searchParams.set('latitude', String(lat))
  u.searchParams.set('longitude', String(lng))
  u.searchParams.set('current', 'temperature_2m,weather_code')
  u.searchParams.set('timezone', 'auto')

  const res = await fetch(u.toString(), { signal })
  if (!res.ok) throw new Error('Weather unavailable')
  const data = (await res.json()) as {
    current?: { temperature_2m?: number; weather_code?: number }
  }
  const t = data.current?.temperature_2m
  const code = data.current?.weather_code
  if (t == null || code == null) throw new Error('Weather incomplete')
  return {
    tempC: Math.round(t),
    kind: classifyWeatherCode(code),
    provider: 'openmeteo',
  }
}

async function fetchGoogleWeather(
  lat: number,
  lng: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const u = new URL('https://weather.googleapis.com/v1/currentConditions:lookup')
  u.searchParams.set('key', apiKey)
  u.searchParams.set('location.latitude', String(lat))
  u.searchParams.set('location.longitude', String(lng))

  const res = await fetch(u.toString(), { signal })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Google Weather ${res.status}: ${errText.slice(0, 120)}`)
  }

  const data = (await res.json()) as {
    temperature?: { degrees?: number; unit?: string }
    weatherCondition?: { type?: string; iconBaseUri?: string }
  }

  const deg = data.temperature?.degrees
  const type = data.weatherCondition?.type
  if (deg == null || !type) throw new Error('Google Weather response incomplete')

  const iconBase = data.weatherCondition?.iconBaseUri
  const iconUrl = iconBase ? `${iconBase}.svg` : undefined

  return {
    tempC: Math.round(deg),
    kind: googleConditionTypeToKind(type),
    provider: 'google',
    iconUrl,
  }
}

/**
 * Prefer Google Maps Weather API when `VITE_GOOGLE_MAPS_API_KEY` is set;
 * otherwise Open-Meteo. If Google fails (network, billing, CORS), falls back to Open-Meteo.
 */
export async function fetchCurrentWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const key = getGoogleApiKey()
  if (key) {
    try {
      return await fetchGoogleWeather(lat, lng, key, signal)
    } catch {
      /* fall through */
    }
  }
  return fetchOpenMeteo(lat, lng, signal)
}

const FROST_THRESHOLD_C = 2
export const HEAT_THRESHOLD_C = 32
const HOURLY_CACHE_TTL_MS = 60 * 60 * 1000

type HourlyPoint = { time: string; degrees: number }

let hourlyCache: {
  key: string
  fetchedAt: number
  points: HourlyPoint[]
  provider: WeatherProvider
} | null = null

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

async function fetchGoogleHourlyTemps(
  lat: number,
  lng: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<HourlyPoint[]> {
  const u = new URL('https://weather.googleapis.com/v1/forecast/hours:lookup')
  u.searchParams.set('key', apiKey)
  u.searchParams.set('location.latitude', String(lat))
  u.searchParams.set('location.longitude', String(lng))
  u.searchParams.set('hours', '24')

  const res = await fetch(u.toString(), { signal })
  if (!res.ok) throw new Error(`Google forecast ${res.status}`)

  const data = (await res.json()) as {
    forecastHours?: Array<{
      interval?: { startTime?: string }
      temperature?: { degrees?: number }
    }>
  }

  const hours = data.forecastHours
  if (!hours?.length) return []

  const points: HourlyPoint[] = []
  for (const h of hours) {
    const degrees = h.temperature?.degrees
    const time = h.interval?.startTime
    if (degrees == null || !time) continue
    points.push({ time, degrees })
  }
  return points
}

async function fetchOpenMeteoHourlyTemps(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<HourlyPoint[]> {
  const u = new URL('https://api.open-meteo.com/v1/forecast')
  u.searchParams.set('latitude', String(lat))
  u.searchParams.set('longitude', String(lng))
  u.searchParams.set('hourly', 'temperature_2m')
  u.searchParams.set('forecast_hours', '24')
  u.searchParams.set('timezone', 'auto')

  const res = await fetch(u.toString(), { signal })
  if (!res.ok) throw new Error('Hourly forecast unavailable')

  const data = (await res.json()) as {
    hourly?: { time?: string[]; temperature_2m?: number[] }
  }

  const times = data.hourly?.time
  const temps = data.hourly?.temperature_2m
  if (!times?.length || !temps?.length) return []

  const points: HourlyPoint[] = []
  for (let i = 0; i < times.length; i++) {
    const degrees = temps[i]
    if (degrees == null) continue
    points.push({ time: times[i], degrees })
  }
  return points
}

async function fetchHourlyTemperatures(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<{ points: HourlyPoint[]; provider: WeatherProvider }> {
  const key = cacheKey(lat, lng)
  if (
    hourlyCache?.key === key &&
    Date.now() - hourlyCache.fetchedAt < HOURLY_CACHE_TTL_MS
  ) {
    return { points: hourlyCache.points, provider: hourlyCache.provider }
  }

  const googleKey = getGoogleApiKey()
  if (googleKey) {
    try {
      const points = await fetchGoogleHourlyTemps(lat, lng, googleKey, signal)
      if (points.length) {
        hourlyCache = { key, fetchedAt: Date.now(), points, provider: 'google' }
        return { points, provider: 'google' }
      }
    } catch {
      /* fall through */
    }
  }

  const points = await fetchOpenMeteoHourlyTemps(lat, lng, signal)
  hourlyCache = { key, fetchedAt: Date.now(), points, provider: 'openmeteo' }
  return { points, provider: 'openmeteo' }
}

function hoursUntilStart(startsAt: string) {
  return Math.max(0, Math.round((new Date(startsAt).getTime() - Date.now()) / 3_600_000))
}

function detectFrost(points: HourlyPoint[], provider: WeatherProvider): FrostWindow | null {
  let minTemp = Infinity
  let frostStart: string | undefined

  for (const { time, degrees } of points) {
    if (degrees < minTemp) minTemp = degrees
    if (degrees <= FROST_THRESHOLD_C && !frostStart) frostStart = time
  }

  if (!frostStart || minTemp > FROST_THRESHOLD_C) return null
  return {
    startsAt: frostStart,
    minTempC: Math.round(minTemp),
    hoursUntil: hoursUntilStart(frostStart),
    provider,
  }
}

function detectHeat(points: HourlyPoint[], provider: WeatherProvider): HeatWindow | null {
  let maxTemp = -Infinity
  let heatStart: string | undefined

  for (const { time, degrees } of points) {
    if (degrees > maxTemp) maxTemp = degrees
    if (degrees > HEAT_THRESHOLD_C && !heatStart) heatStart = time
  }

  if (!heatStart || maxTemp <= HEAT_THRESHOLD_C) return null
  return {
    startsAt: heatStart,
    maxTempC: Math.round(maxTemp),
    hoursUntil: hoursUntilStart(heatStart),
    provider,
  }
}

/** Frost (≤ 2 °C) or heat (> HEAT_THRESHOLD_C) from one 24 h hourly fetch (cached 1 h). */
export async function fetchExtremeTemperatureAlerts(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<{ frost: FrostWindow | null; heat: HeatWindow | null }> {
  const { points, provider } = await fetchHourlyTemperatures(lat, lng, signal)
  if (!points.length) return { frost: null, heat: null }
  return {
    frost: detectFrost(points, provider),
    heat: detectHeat(points, provider),
  }
}

/** Check whether frost (≤ 2 °C) is forecast in the next 24 hours. */
export async function fetchFrostForecast(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<FrostWindow | null> {
  const { points, provider } = await fetchHourlyTemperatures(lat, lng, signal)
  return detectFrost(points, provider)
}

/** Check whether heat (> HEAT_THRESHOLD_C) is forecast in the next 24 hours. */
export async function fetchHeatForecast(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<HeatWindow | null> {
  const { points, provider } = await fetchHourlyTemperatures(lat, lng, signal)
  return detectHeat(points, provider)
}
