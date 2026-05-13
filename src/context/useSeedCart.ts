import { useContext } from 'react'
import { SeedCartContext } from './SeedCartContextInternal'

export function useSeedCart() {
  const ctx = useContext(SeedCartContext)
  if (!ctx) throw new Error('useSeedCart must be used within SeedCartProvider')
  return ctx
}
