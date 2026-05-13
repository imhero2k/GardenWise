import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SeedCartAddInput, SeedCartItemV1, SeedCartStateV1 } from './seedCartTypes'
import { SeedCartContext } from './SeedCartContextInternal'

const STORAGE_KEY = 'rootvio-seed-cart-v1'
const MAX_ITEMS = 200

function isItem(x: unknown): x is SeedCartItemV1 {
  if (!x || typeof x !== 'object') return false
  const o = x as Partial<SeedCartItemV1>
  return (
    typeof o.id === 'string' &&
    typeof o.scientificName === 'string' &&
    (o.commonName === null || typeof o.commonName === 'string') &&
    (o.imageUrl === null || typeof o.imageUrl === 'string') &&
    (o.lfCode === null || typeof o.lfCode === 'string') &&
    typeof o.addedAt === 'string'
  )
}

function loadStored(): SeedCartItemV1[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<SeedCartStateV1>
    if (parsed?.v !== 1 || !Array.isArray(parsed.items)) return []
    const out: SeedCartItemV1[] = []
    const seen = new Set<string>()
    for (const it of parsed.items) {
      if (!isItem(it) || seen.has(it.id)) continue
      seen.add(it.id)
      out.push(it)
    }
    return out
  } catch {
    return []
  }
}

function saveStored(items: SeedCartItemV1[]) {
  if (typeof window === 'undefined') return
  try {
    const state: SeedCartStateV1 = { v: 1, items }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function SeedCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SeedCartItemV1[]>(() => loadStored())

  useEffect(() => {
    saveStored(items)
  }, [items])

  /* Sync across tabs on the same origin. */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      setItems(loadStored())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isInCart = useCallback(
    (id: string) => items.some((it) => it.id === id),
    [items],
  )

  const add = useCallback((input: SeedCartAddInput) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === input.id)) return prev
      const next: SeedCartItemV1 = { ...input, addedAt: new Date().toISOString() }
      const merged = [next, ...prev]
      return merged.length > MAX_ITEMS ? merged.slice(0, MAX_ITEMS) : merged
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const toggle = useCallback((input: SeedCartAddInput) => {
    setItems((prev) => {
      if (prev.some((it) => it.id === input.id)) {
        return prev.filter((it) => it.id !== input.id)
      }
      const next: SeedCartItemV1 = { ...input, addedAt: new Date().toISOString() }
      const merged = [next, ...prev]
      return merged.length > MAX_ITEMS ? merged.slice(0, MAX_ITEMS) : merged
    })
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      isInCart,
      add,
      remove,
      toggle,
      clear,
    }),
    [items, isInCart, add, remove, toggle, clear],
  )

  return <SeedCartContext.Provider value={value}>{children}</SeedCartContext.Provider>
}
