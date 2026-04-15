/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Maps Platform API key (enable Weather API in Cloud Console). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  /** Optional override for weed prediction API URL. */
  readonly VITE_PREDICT_API_URL?: string
  /**
   * Base URL for the recommendations API (e.g. `https://api.example.com`).
   * If unset, `/api` is used (Vite dev proxy → local `server/index.mjs`).
   */
  readonly VITE_API_BASE_URL?: string

  /** Firebase web config (Authentication). */
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
