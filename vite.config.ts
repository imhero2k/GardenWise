import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Production base: set `VITE_BASE_PATH` in CI (e.g. `/iteration2/` for https://rootivio.app/iteration2/). Must match the folder name used when staging the artifact.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
