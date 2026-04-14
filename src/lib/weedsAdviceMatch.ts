/**
 * Combine ALA "best practice management" text with your own management advice entries
 * using simple keyword overlap (good enough for demos; refine with stemming/FTS later).
 */

import type { WeedsManagementAdvice } from './alaWeedsProfile'

/** One row in your dataset (e.g. JSON or TS module). */
export type LocalManagementAdviceEntry = {
  id: string
  /** Lowercase keywords or phrases to match against ALA plain text (and optionally each other). */
  keywords: string[]
  /** Short advice to show when this entry matches. */
  advice: string
}

/** HTML fragment → plain text for matching (not for display typography). */
export function managementHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): Set<string> {
  const lower = text.toLowerCase()
  const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length >= 3)
  return new Set(words)
}

/**
 * Scores local entries by how many of their keywords appear in the ALA plain-text blob.
 * Returns entries with at least `minOverlap` keyword hits, highest score first.
 */
export function matchLocalAdviceToAlaText(
  alaPlainText: string,
  entries: LocalManagementAdviceEntry[],
  minOverlap: number = 1,
): { entry: LocalManagementAdviceEntry; score: number }[] {
  const alaTokens = tokenize(alaPlainText)
  const alaLower = alaPlainText.toLowerCase()

  const scored = entries.map((entry) => {
    let score = 0
    for (const kw of entry.keywords) {
      const k = kw.trim().toLowerCase()
      if (k.length < 2) continue
      if (k.includes(' ')) {
        if (alaLower.includes(k)) score += 2
      } else if (alaTokens.has(k)) {
        score += 1
      }
    }
    return { entry, score }
  })

  return scored
    .filter((s) => s.score >= minOverlap)
    .sort((a, b) => b.score - a.score)
}

export function advicePlainTextForMatching(advice: WeedsManagementAdvice): string {
  const html = advice.bestPracticeManagementHtml ?? ''
  return managementHtmlToPlainText(html)
}
