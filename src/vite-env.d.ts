/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Maps Platform API key (enable Weather API in Cloud Console). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
