import { createContext } from 'react'
import type { SeedCartContextValue } from './seedCartTypes'

export const SeedCartContext = createContext<SeedCartContextValue | null>(null)
