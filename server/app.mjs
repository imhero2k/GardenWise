import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import { queryRecommendations } from './recommendations.mjs'
import { queryRegionWeeds } from './weeds.mjs'
import { queryTopWeeds } from './topWeeds.mjs'

/**
 * pg parses sslmode=require as verify-full (strict CA check). RDS uses Amazon CA; Node then
 * errors unless you bundle the CA. For local/dev we strip sslmode and rely on encrypted TLS +
 * rejectUnauthorized: false unless DATABASE_SSL_REJECT_UNAUTH=1 (stricter verify).
 */
function stripSslModeFromUrl(url) {
  if (!url) return url
  try {
    const normalized = url.replace(/^postgresql:\/\//i, 'postgres://')
    const u = new URL(normalized)
    u.searchParams.delete('sslmode')
    let out = u.toString()
    if (url.startsWith('postgresql://')) out = out.replace(/^postgres:\/\//, 'postgresql://')
    return out
  } catch {
    return url.replace(/([?&])sslmode=[^&]*&?/g, '$1').replace(/\?$/, '')
  }
}

/** @type {Pool | null} */
let pool = null
let connectionConfigured = false

function isDatabaseConfigured() {
  return Boolean(String(process.env.DATABASE_URL ?? '').trim())
}

function getPool() {
  if (pool) return pool

  const connectionStringRaw = process.env.DATABASE_URL
  connectionConfigured = isDatabaseConfigured()
  const connectionString = connectionStringRaw ? stripSslModeFromUrl(connectionStringRaw) : undefined

  pool = new Pool({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === '0'
        ? false
        : connectionString
          ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTH === '1' }
          : undefined,
  })
  return pool
}

function configuredGuard(res) {
  if (isDatabaseConfigured()) return true
  res.status(503).json({ error: 'Server is not configured with DATABASE_URL' })
  return false
}

function parsePageSize(raw, fallback = 12) {
  return Math.min(50, Math.max(1, parseInt(String(raw ?? fallback), 10) || fallback))
}

function parseOffset(raw) {
  return Math.max(0, parseInt(String(raw ?? '0'), 10) || 0)
}

function parseQ(raw) {
  return typeof raw === 'string' ? raw.trim() : ''
}

function parseLatLng(req, res) {
  const lat = Number(req.query.lat)
  const lng = Number(req.query.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    res.status(400).json({ error: 'Query parameters lat and lng are required (numbers)' })
    return null
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: 'Coordinates out of range' })
    return null
  }
  return { lat, lng }
}

export const app = express()

// CORS: set CORS_ORIGIN to your GitHub Pages origin(s), comma-separated. Local Vite dev origins are always merged when CORS_ORIGIN is non-empty so you can test against API Gateway/Lambda from localhost.
const LOCAL_VITE_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
const allow = (process.env.CORS_ORIGIN ?? '').trim()
const fromEnv = allow ? allow.split(',').map((s) => s.trim()).filter(Boolean) : []
const allowList = fromEnv.length ? [...new Set([...fromEnv, ...LOCAL_VITE_ORIGINS])] : []
app.use(
  cors({
    origin: allowList.length ? allowList : true,
    methods: ['GET', 'OPTIONS'],
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: isDatabaseConfigured() })
})

app.get('/api/recommendations', async (req, res) => {
  if (!configuredGuard(res)) return
  const ll = parseLatLng(req, res)
  if (!ll) return
  const pageSize = parsePageSize(req.query.pageSize, 12)
  const offset = parseOffset(req.query.offset)
  const q = parseQ(req.query.q)

  try {
    const data = await queryRecommendations(getPool(), ll.lng, ll.lat, { limit: pageSize, offset, q })
    res.json(data)
  } catch (err) {
    console.error('[recommendations]', err)
    const message = err instanceof Error ? err.message : 'Query failed'
    res.status(500).json({ error: message })
  }
})

app.get('/api/weeds', async (req, res) => {
  if (!configuredGuard(res)) return
  const ll = parseLatLng(req, res)
  if (!ll) return
  const pageSize = parsePageSize(req.query.pageSize, 12)
  const offset = parseOffset(req.query.offset)
  const q = parseQ(req.query.q)

  try {
    const data = await queryRegionWeeds(getPool(), ll.lng, ll.lat, { limit: pageSize, offset, q })
    res.json(data)
  } catch (err) {
    console.error('[weeds]', err)
    const message = err instanceof Error ? err.message : 'Query failed'
    res.status(500).json({ error: message })
  }
})

app.get('/api/weeds/top', async (req, res) => {
  if (!configuredGuard(res)) return
  const pageSize = parsePageSize(req.query.pageSize, 12)
  const offset = parseOffset(req.query.offset)
  const q = parseQ(req.query.q)
  try {
    const data = await queryTopWeeds(getPool(), { limit: pageSize, offset, q })
    res.json(data)
  } catch (err) {
    console.error('[weeds/top]', err)
    const message = err instanceof Error ? err.message : 'Query failed'
    res.status(500).json({ error: message })
  }
})

