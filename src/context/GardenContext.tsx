import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { plants } from '../data/plants'
import type { GardenPlant, Plant } from '../types/plant'

function plantToGardenPlant(plant: Plant, index: number): GardenPlant {
  const healthCycle: GardenPlant['health'][] = ['Thriving', 'Good', 'Needs care']
  const due = ['Today', 'Tomorrow', 'In 3 days', 'Next week']
  return {
    ...plant,
    health: healthCycle[index % healthCycle.length],
    waterDue: due[index % due.length],
  }
}

interface GardenContextValue {
  gardenPlants: GardenPlant[]
  addPlant: (plantId: string) => void
  hasPlant: (plantId: string) => boolean
}

const GardenContext = createContext<GardenContextValue | null>(null)

const initialIds = ['1', '3']

export function GardenProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(initialIds)

  const gardenPlants = useMemo(() => {
    return ids
      .map((id, i) => {
        const p = plants.find((x) => x.id === id)
        return p ? plantToGardenPlant(p, i) : null
      })
      .filter(Boolean) as GardenPlant[]
  }, [ids])

  const addPlant = useCallback((plantId: string) => {
    setIds((prev) => (prev.includes(plantId) ? prev : [...prev, plantId]))
  }, [])

  const hasPlant = useCallback(
    (plantId: string) => ids.includes(plantId),
    [ids],
  )

  const value = useMemo(
    () => ({ gardenPlants, addPlant, hasPlant }),
    [gardenPlants, addPlant, hasPlant],
  )

  return (
    <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
  )
}

export function useGarden() {
  const ctx = useContext(GardenContext)
  if (!ctx) throw new Error('useGarden must be used within GardenProvider')
  return ctx
}
