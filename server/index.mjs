import dotenv from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from './app.mjs'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(rootDir, '.env') })
dotenv.config({ path: join(rootDir, '.env.local'), override: true })

if (!process.env.DATABASE_URL) {
  console.warn('[GardenWise API] DATABASE_URL is not set. Set it to your PostgreSQL connection string (e.g. RDS).')
}

const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`[GardenWise API] http://localhost:${port}`)
})
