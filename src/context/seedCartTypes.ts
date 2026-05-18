/**
 * Persisted "seed cart" — plants the user has bookmarked from PlantMe
 * for tracking what they want to grow or sow.
 *
 * v1 is device-scoped (single localStorage key for all users on this browser).
 * If we later want per-user carts synced to DynamoDB, swap the storage layer
 * inside SeedCartProvider without changing this type.
 */

export interface SeedCartItemV1 {
  /** Stable plant id from the recommendations API (RDS id). */
  id: string
  scientificName: string
  commonName: string | null
  imageUrl: string | null
  /** Life-form code (e.g. `T`, `MS`); may be null if the API didn't return it. */
  lfCode: string | null
  /** ISO timestamp of when the item was added. */
  addedAt: string
  /** How many plants to buy or grow (nursery list quantity). */
  quantity: number
}

export interface SeedCartStateV1 {
  v: 1
  items: SeedCartItemV1[]
}

/** Minimal input accepted by `add()` — only fields we want to persist. */
export type SeedCartAddInput = Omit<SeedCartItemV1, 'addedAt' | 'quantity'> & {
  quantity?: number
}

export interface SeedCartContextValue {
  items: SeedCartItemV1[]
  /** Number of distinct saved plants (lines). */
  count: number
  /** Sum of all line quantities. */
  totalQuantity: number
  isInCart: (id: string) => boolean
  add: (input: SeedCartAddInput) => void
  remove: (id: string) => void
  toggle: (input: SeedCartAddInput) => void
  changeQuantity: (id: string, delta: number) => void
  clear: () => void
}
