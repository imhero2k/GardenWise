import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages: set VITE_BASE_PATH=/GardenWise/ in CI (see .github/workflows)
const base = process.env.VITE_BASE_PATH ?? '/'
const baseNoSlash = base.replace(/\/$/, '')

/** Forwards to profiles.ala.org.au with /ala-profiles stripped (ALA has no such path segment). */
const alaProfilesProxy = {
  target: 'https://profiles.ala.org.au',
  changeOrigin: true,
  secure: true,
  rewrite: (path: string) => path.replace(/^\/ala-profiles/, ''),
} as const

const alaProfilesProxyPrefixed =
  baseNoSlash && baseNoSlash !== ''
    ? {
        [`${baseNoSlash}/ala-profiles`]: {
          target: 'https://profiles.ala.org.au',
          changeOrigin: true,
          secure: true,
          rewrite: (path: string) => path.replace(new RegExp(`^${baseNoSlash}/ala-profiles`), ''),
        },
      }
    : {}

const alaProfilesProxies = {
  '/ala-profiles': alaProfilesProxy,
  ...alaProfilesProxyPrefixed,
} as const

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    // ALA Profiles JSON has no CORS for browsers; proxy in dev/preview (see src/lib/alaWeedsProfile.ts).
    proxy: { ...alaProfilesProxies },
  },
  preview: {
    proxy: { ...alaProfilesProxies },
  },
})
