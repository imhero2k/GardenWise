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
