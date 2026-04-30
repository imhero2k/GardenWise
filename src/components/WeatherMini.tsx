import type { WeatherFetchState } from '../hooks/useWeather'
import { IconWeatherCloudy, IconWeatherRainy, IconWeatherSunny } from './Icons'

const labels: Record<string, string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rainy: 'Rain or showers',
}

export function WeatherMini({ state }: { state: WeatherFetchState }) {
  if (state.status === 'idle') return null

  if (state.status === 'loading') {
    return (
      <div
        className="location-bar__weather location-bar__weather--loading"
        aria-busy
        aria-label="Loading weather"
      >
        <IconWeatherSunny className="location-bar__wx-icon" />
      </div>
    )
  }

  if (state.status === 'error') return null

  const { tempC, kind, provider, iconUrl } = state.data
  const Icon = kind === 'sunny' ? IconWeatherSunny : kind === 'rainy' ? IconWeatherRainy : IconWeatherCloudy
  const sourceLabel = provider === 'google' ? 'Google Weather' : 'Open-Meteo'

  return (
    <div
      className="location-bar__weather"
      title={`${tempC}°C · ${labels[kind] ?? kind} (${sourceLabel})`}
      aria-label={`${tempC} degrees, ${labels[kind] ?? kind}`}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" className="location-bar__wx-icon location-bar__wx-icon--img" loading="lazy" />
      ) : (
        <Icon className="location-bar__wx-icon" aria-hidden />
      )}
      <span className="location-bar__temp">{tempC}°</span>
    </div>
  )
}
