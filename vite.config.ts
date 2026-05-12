import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
// CI sets `VITE_BASE_PATH` per deploy: `/` and `/iteration1/` from `production`, `/iteration2/` from `main` (see `.github/workflows/pages.yml`).
export default defineConfig({
  plugins: [react(), cloudflare()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})