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
      // PlantNet Identify from browser (avoids CORS when calling my-api.plantnet.org directly)
      '/dev/plantnet': {
        target: 'https://my-api.plantnet.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev\/plantnet/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // PlantNet rejects some browser Origins; server-to-server should not send a browser Origin.
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
