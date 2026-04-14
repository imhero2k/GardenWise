/**
 * Weeds Australia profiles (ALA Profiles collection).
 * JSON endpoint matches profile-hub: GET /opus/{opus}/profile/{id}/json
 * @see https://profiles.ala.org.au/
 *
 * Note: profiles.ala.org.au does not send Access-Control-Allow-Origin. Browser
 * requests from localhost/production origins require a same-origin proxy (Vite
 * dev server provides /ala-profiles → profiles.ala.org.au).
 */

import { alaWeedsAustraliaProfileUrl } from './alaSpecies'

const WEEDS_OPUS_SLUG = 'weeds-australia'

/** Strip obvious script/event-handler vectors before rendering trusted ALA HTML. */
export function sanitizeTrustedAlaHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

interface ProfileAttribute {
  title?: string
  text?: string
}

interface ProfileJson {
  profile?: {
    attributes?: ProfileAttribute[]
  }
  opus?: {
    shortLicense?: string
  }
}

export interface WeedsManagementAdvice {
  /** HTML fragment from the "Best practice management" attribute. */
  bestPracticeManagementHtml: string | null
  /** Plain-text-ish license line for attribution. */
  licenseLine: string | null
  profilePageUrl: string
}

function stripHtmlToLine(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Resolves the profile JSON URL. In dev, uses the Vite proxy (see vite.config.ts).
 */
export function weedsAustraliaProfileJsonUrl(scientificName: string): string {
  const q = scientificName.trim()
  const path = `/opus/${WEEDS_OPUS_SLUG}/profile/${encodeURIComponent(q)}/json?fullClassification=true`
  if (import.meta.env.DEV) {
    // Respect Vite base (e.g. /GardenWise/) so the dev proxy can match (see vite.config.ts).
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    return `${base}/ala-profiles${path}`
  }
  return `https://profiles.ala.org.au${path}`
}

/**
 * Fetches structured "Best practice management" text from the Weeds Australia profile JSON.
 */
export async function fetchWeedsAustraliaManagementAdvice(
  scientificName: string,
  signal?: AbortSignal,
): Promise<WeedsManagementAdvice> {
  const url = weedsAustraliaProfileJsonUrl(scientificName)
  const r = await fetch(url, { signal })
  if (!r.ok) throw new Error(`Weeds profile JSON failed (${r.status})`)
  const j = (await r.json()) as ProfileJson
  const attrs = j.profile?.attributes ?? []
  const block = attrs.find((a) => (a.title ?? '').toLowerCase() === 'best practice management')
  const raw = block?.text?.trim()
  const bestPracticeManagementHtml = raw ? sanitizeTrustedAlaHtml(raw) : null
  const lic = j.opus?.shortLicense
  return {
    bestPracticeManagementHtml,
    licenseLine: lic ? stripHtmlToLine(lic) : null,
    profilePageUrl: alaWeedsAustraliaProfileUrl(scientificName),
  }
}
