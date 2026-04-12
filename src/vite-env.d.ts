/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Maps Platform API key (enable Weather API in Cloud Console). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** Optional override for weed prediction API URL. */
  readonly VITE_PREDICT_API_URL?: string
  /** Optional Perenual API key for garden/care info in plant popups (https://perenual.com/user/developer). */
  readonly VITE_PERENUAL_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
