export interface AppRuntimeConfig {
  apiBaseUrl?: string
  predictApiUrl?: string
  googleMapsApiKey?: string
  firebaseApiKey?: string
  firebaseAuthDomain?: string
  firebaseProjectId?: string
  firebaseAppId?: string
  firebaseMessagingSenderId?: string
  firebaseStorageBucket?: string
  firebaseMeasurementId?: string
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppRuntimeConfig
  }
}

const EMPTY_CONFIG: AppRuntimeConfig = {}

export function getAppConfig(): AppRuntimeConfig {
  return typeof window === 'undefined' ? EMPTY_CONFIG : window.__APP_CONFIG__ ?? EMPTY_CONFIG
}

export function getApiBaseUrl(): string {
  return getAppConfig().apiBaseUrl?.trim().replace(/\/+$/, '') ?? ''
}

export function isFirebaseAuthConfigured(config: AppRuntimeConfig = getAppConfig()): boolean {
  return Boolean(
    config.firebaseApiKey?.trim() &&
      config.firebaseAuthDomain?.trim() &&
      config.firebaseProjectId?.trim(),
  )
}
