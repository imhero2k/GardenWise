/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Local development only: bypass Firebase route guard when set to "true". */
  readonly VITE_BYPASS_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
