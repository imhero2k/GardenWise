import { useEffect, useRef, useState } from 'react'
import { enrichPlantByScientificName } from '../lib/plantEnrichment'
import type { RecommendedPlant } from '../lib/recommendationsApi'

export type EnrichedCardData = {
  description?: string
  imageUrl?: string
  linkUrl?: string
}

export type EnrichmentState = EnrichedCardData | 'loading' | undefined

const BATCH = 4

/**
 * Fills missing description / image from Wikipedia + iNaturalist (no API keys).
 * Skips plants that already have both from the database.
 */
export function useRecommendedPlantEnrichment(plants: RecommendedPlant[]): Record<string, EnrichmentState> {
  const [byId, setById] = useState<Record<string, EnrichmentState>>({})
  const fetchedRef = useRef<Set<string>>(new Set())
  const key = plants.map((p) => p.id).join('|')

  useEffect(() => {
    const need = plants.filter(
      (p) =>
        p.scientificName.trim() &&
        !fetchedRef.current.has(p.id) &&
        (!p.description?.trim() || !p.imageUrl?.trim()),
    )
    if (need.length === 0) return

    const ac = new AbortController()
    let cancelled = false

    void (async () => {
      for (let i = 0; i < need.length; i += BATCH) {
        if (cancelled || ac.signal.aborted) return
        const slice = need.slice(i, i + BATCH)
        for (const p of slice) {
          setById((prev) => ({ ...prev, [p.id]: 'loading' }))
        }
        await Promise.all(
          slice.map(async (p) => {
            try {
              const e = await enrichPlantByScientificName(p.scientificName, ac.signal)
              if (cancelled) return
              const extract = e.wikipedia?.extract?.trim()
              const desc =
                extract && extract.length > 320 ? `${extract.slice(0, 317).trim()}…` : extract
              const imageUrl =
                p.imageUrl?.trim() ||
                e.wikipedia?.thumbnailUrl ||
                e.images[0]?.url ||
                undefined
              const linkUrl = e.wikipedia?.pageUrl ?? e.gbif?.speciesPageUrl
              fetchedRef.current.add(p.id)
              setById((prev) => ({
                ...prev,
                [p.id]: {
                  description: desc,
                  imageUrl,
                  linkUrl,
                },
              }))
            } catch {
              fetchedRef.current.add(p.id)
              setById((prev) => ({ ...prev, [p.id]: {} }))
            }
          }),
        )
      }
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` lists plant ids; avoids re-running when parent re-renders same list
  }, [key])

  return byId
}
