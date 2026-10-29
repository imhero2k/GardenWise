import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { serializeRuntimeConfig } from './scripts/runtime-config.mjs'

function runtimeConfigPlugin(): Plugin {
  let mode = 'development'
  let root = process.cwd()

  const getRuntimeConfig = () => ({
    ...loadEnv(mode, root, ''),
    ...process.env,
  })

  return {
    name: 'runtime-app-config',
    configResolved(config) {
      mode = config.mode
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use('/runtime-config.js', (request, response, next) => {
        if (request.method !== 'GET') {
          next()
          return
        }
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(serializeRuntimeConfig(getRuntimeConfig()))
      })
    },
    closeBundle() {
      if (mode === 'production') {
        const outputDirectory = resolve(root, 'dist')
        mkdirSync(outputDirectory, { recursive: true })
        writeFileSync(
          resolve(outputDirectory, 'runtime-config.js'),
          serializeRuntimeConfig(getRuntimeConfig()),
          'utf8',
        )
      }
    },
  }
}

// https://vite.dev/config/
// CI sets `VITE_BASE_PATH` per deploy: `/` from `main` (production), `/iteration1/` and `/iteration2/` from their branches (see `.github/workflows/pages.yml`).
export default defineConfig({
  plugins: [react(), runtimeConfigPlugin()],
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
