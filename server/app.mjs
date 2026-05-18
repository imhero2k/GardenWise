import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import { parseWildlifeCategories } from './db.mjs'
import { queryRecommendations } from './recommendations.mjs'
import { queryRegionWeeds } from './weeds.mjs'
import { queryTopWeeds } from './topWeeds.mjs'
import { queryPlantListedInBioregion, queryWeedLookupByName } from './weedLookup.mjs'
import { queryPlantDetails } from './plantDetails.mjs'
import { queryPlannerRecommendations } from './plannerRecommendations.mjs'
import { isFirebaseAdminConfigured, verifyFirebaseIdToken } from './firebaseAdmin.mjs'
import {
  getPlannerLayoutItem,
  putPlannerLayoutItem,
  isPlannerLayoutTableConfigured,
} from './plannerLayoutDynamo.mjs'
import { validatePlannerLayoutPayload } from './plannerLayoutValidate.mjs'

/**
 * pg parses sslmode=require as verify-full (strict CA check). RDS uses Amazon's CA; Node
 * then errors unless you bundle it. For local/dev we strip sslmode and rely on encrypted
 * TLS + rejectUnauthorized:false unless DATABASE_SSL_REJECT_UNAUTH=1.
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

function isDatabaseConfigured() {
  return Boolean(String(process.env.DATABASE_URL ?? '').trim())
}

function getPool() {
  if (pool) return pool
  const raw = process.env.DATABASE_URL
  const connectionString = raw ? stripSslModeFromUrl(raw) : undefined
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

function parsePageSize(raw, fallback = 12) {
  return Math.min(50, Math.max(1, parseInt(String(raw ?? fallback), 10) || fallback))
}

function parseOffset(raw) {
  return Math.max(0, parseInt(String(raw ?? '0'), 10) || 0)
}

function parseQ(raw) {
  return typeof raw === 'string' ? raw.trim() : ''
}

const LF_CODES = new Set([
  'MS',
  'SS',
  'T',
  'MH',
  'PS',
  'SH',
  'GF',
  'LH',
  'EP',
  'MTG',
  'SC',
  'LTG',
  'MNG',
  'LNG',
  'TTG',
  'HG',
])

function parseLfCode(raw) {
  if (typeof raw !== 'string') return ''
  const value = raw.trim().toUpperCase()
  return LF_CODES.has(value) ? value : ''
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

/** Wrap a handler so DB-config and runtime errors return consistent JSON. */
function wrap(label, handler) {
  return async (req, res) => {
    if (!isDatabaseConfigured()) {
      return res.status(503).json({ error: 'Server is not configured with DATABASE_URL' })
    }
    try {
      await handler(req, res)
    } catch (err) {
      console.error(`[${label}]`, err)
      const message = err instanceof Error ? err.message : 'Query failed'
      res.status(500).json({ error: message })
    }
  }
}

/** Bearer Firebase ID token → `req.firebaseUid` (503 if Admin SDK missing, 401 if bad token). */
async function requireFirebaseUid(req, res, next) {
  if (!isFirebaseAdminConfigured()) {
    res.status(503).json({ error: 'Firebase Admin is not configured (set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS)' })
    return
  }
  const h = req.headers.authorization
  const m = typeof h === 'string' && /^Bearer\s+(\S+)/i.exec(h)
  const token = m?.[1]
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization: Bearer Firebase ID token' })
    return
  }
  try {
    const uid = await verifyFirebaseIdToken(token)
    req.firebaseUid = uid
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const app = express()

// CORS: set CORS_ORIGIN to your frontend origin(s), comma-separated. Local Vite dev origins
// are merged in automatically when CORS_ORIGIN is non-empty so you can hit Lambda from localhost.
const LOCAL_VITE_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]
const fromEnv = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const allowList = fromEnv.length ? [...new Set([...fromEnv, ...LOCAL_VITE_ORIGINS])] : []
app.use(
  cors({
    origin: allowList.length ? allowList : true,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)

/**
 * Pl@ntNet proxy — browser calls same-origin `/api/...`; server forwards to my-api.plantnet.org
 * (avoids Pl@ntNet "Origin not allowed" CORS on direct browser calls).
 * Env: PLANTNET_API_KEY or VITE_PLANTNET_API_KEY (server loads `.env.local` via `server/index.mjs`).
 */
app.post('/api/plantnet/identify', express.json({ limit: '35mb' }), async (req, res) => {
  const key =
    String(process.env.PLANTNET_API_KEY ?? '').trim() ||
    String(process.env.VITE_PLANTNET_API_KEY ?? '').trim()
  if (!key) {
    return res.status(503).json({
      error:
        'PlantNet key not configured on API server (set PLANTNET_API_KEY or VITE_PLANTNET_API_KEY in .env.local for the API process)',
    })
  }
  const imageBase64 = req.body?.imageBase64
  const organ =
    typeof req.body?.organ === 'string' && req.body.organ.trim() ? req.body.organ.trim() : 'leaf'
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    return res.status(400).json({ error: 'JSON body must include imageBase64 (base64 string)' })
  }
  let buf
  try {
    buf = Buffer.from(String(imageBase64).replace(/\s+/g, ''), 'base64')
  } catch {
    return res.status(400).json({ error: 'Invalid base64 image' })
  }
  if (!buf.length) return res.status(400).json({ error: 'Empty image buffer' })

  const upstreamUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(key)}`
  try {
    const blob = new Blob([buf], { type: 'image/jpeg' })
    const fd = new FormData()
    fd.append('images', blob, 'image.jpg')
    fd.append('organs', organ)
    const upstream = await fetch(upstreamUrl, { method: 'POST', body: fd })
    const text = await upstream.text()
    res.status(upstream.status).type('application/json').send(text)
  } catch (err) {
    console.error('[plantnet]', err)
    res.status(502).json({ error: err instanceof Error ? err.message : 'PlantNet request failed' })
  }
})

app.use(express.json({ limit: '600kb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    database: isDatabaseConfigured(),
    plannerLayoutStorage: isPlannerLayoutTableConfigured(),
    firebaseAdmin: isFirebaseAdminConfigured(),
  })
})

app.get(
  '/api/recommendations',
  wrap('recommendations', async (req, res) => {
    const ll = parseLatLng(req, res)
    if (!ll) return
    const data = await queryRecommendations(getPool(), ll.lng, ll.lat, {
      limit: parsePageSize(req.query.pageSize),
      offset: parseOffset(req.query.offset),
      q: parseQ(req.query.q),
      lfCode: parseLfCode(req.query.lfCode),
      wildlife: parseWildlifeCategories(req.query.wildlife),
    })
    res.json(data)
  }),
)

app.get(
  '/api/plants/:id',
  wrap('plant-detail', async (req, res) => {
    const id = parseInt(String(req.params.id ?? ''), 10)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Plant id must be a positive integer' })
    }
    const detail = await queryPlantDetails(getPool(), id)
    if (!detail) return res.status(404).json({ error: 'Plant not found' })
    res.json(detail)
  }),
)

app.get(
  '/api/weeds',
  wrap('weeds', async (req, res) => {
    const ll = parseLatLng(req, res)
    if (!ll) return
    const data = await queryRegionWeeds(getPool(), ll.lng, ll.lat, {
      limit: parsePageSize(req.query.pageSize),
      offset: parseOffset(req.query.offset),
      q: parseQ(req.query.q),
    })
    res.json(data)
  }),
)

app.get(
  '/api/weeds/top',
  wrap('weeds/top', async (req, res) => {
    const data = await queryTopWeeds(getPool(), {
      limit: parsePageSize(req.query.pageSize),
      offset: parseOffset(req.query.offset),
      q: parseQ(req.query.q),
    })
    res.json(data)
  }),
)

/** Match `plant` + `weed_info` by scientific name (from plant identifier / ID tools). */
app.get(
  '/api/weeds/lookup',
  wrap('weeds/lookup', async (req, res) => {
    const name = parseQ(req.query.name) || parseQ(req.query.q)
    if (!name) {
      return res.status(400).json({ error: 'Query parameter name (or q) is required' })
    }
    const match = await queryWeedLookupByName(getPool(), name)
    if (!match) {
      return res.json({ match: null })
    }
    let inBioregion = null
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      inBioregion = await queryPlantListedInBioregion(getPool(), lng, lat, match.id)
    }
    res.json({ match: { ...match, inBioregion } })
  }),
)

app.get(
  '/api/planner/recommendations',
  wrap('planner/recommendations', async (req, res) => {
    const ll = parseLatLng(req, res)
    if (!ll) return
    const goal =
      req.query.goal === 'pollinator'
        ? 'pollinator'
        : req.query.goal === 'bird'
          ? 'bird'
          : null
    if (!goal) {
      return res
        .status(400)
        .json({ error: 'Query parameter goal must be bird or pollinator' })
    }
    const data = await queryPlannerRecommendations(getPool(), goal, ll.lng, ll.lat)
    res.json(data)
  }),
)

app.get('/api/planner/layout', requireFirebaseUid, async (req, res) => {
  if (!isPlannerLayoutTableConfigured()) {
    res.status(503).json({ error: 'Planner layout storage is not configured (DYNAMODB_PLANNER_LAYOUT_TABLE)' })
    return
  }
  try {
    const item = await getPlannerLayoutItem(req.firebaseUid)
    if (!item?.payload) {
      res.json({ layout: null, updatedAt: item?.updatedAt ?? null })
      return
    }
    res.json({ layout: item.payload, updatedAt: item.updatedAt ?? null })
  } catch (err) {
    console.error('[planner-layout get]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load layout' })
  }
})

app.put('/api/planner/layout', requireFirebaseUid, async (req, res) => {
  if (!isPlannerLayoutTableConfigured()) {
    res.status(503).json({ error: 'Planner layout storage is not configured (DYNAMODB_PLANNER_LAYOUT_TABLE)' })
    return
  }
  const checked = validatePlannerLayoutPayload(req.body)
  if (!checked.ok) {
    res.status(400).json({ error: checked.error })
    return
  }
  try {
    const { updatedAt } = await putPlannerLayoutItem(req.firebaseUid, checked.payload)
    res.json({ ok: true, updatedAt })
  } catch (err) {
    console.error('[planner-layout put]', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to save layout' })
  }
})
