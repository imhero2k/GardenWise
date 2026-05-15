import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// CI sets `VITE_BASE_PATH` per deploy: `/` and `/iteration1/` from `production`, `/iteration2/` from `main` (see `.github/workflows/pages.yml`).
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    proxy: {
      // Browser → Lambda predict (avoids CORS "Load failed" on localhost)
      '/dev/predict': {
        target: 'https://7muezhf0bl.execute-api.ap-southeast-2.amazonaws.com',
        changeOrigin: true,
        rewrite: () => '/testing/predict',
      },
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
