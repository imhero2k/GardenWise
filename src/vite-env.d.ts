/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Maps Platform API key (enable Weather API in Cloud Console). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** Optional override for weed prediction API URL. */
  readonly VITE_PREDICT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
