import { useMemo, useState } from 'react'
import { PlantCard } from '../components/PlantCard'
import { IconSearch } from '../components/Icons'
import { searchPlants } from '../data/plants'

export function PlantSearchPage() {
  const [q, setQ] = useState('')

  const results = useMemo(() => searchPlants(q), [q])

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">PlantMe</p>
        <h1>Search plants</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Look up sunlight, water needs, and invasive risk before you buy.
        </p>
      </header>

      <div className="search-field" style={{ marginBottom: 'var(--space-lg)' }}>
        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>
          <IconSearch />
        </span>
        <label htmlFor="plant-search" className="sr-only">
          Search plant name
        </label>
        <input
          id="plant-search"
          type="search"
          placeholder="Search plant name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
        {results.length} plant{results.length === 1 ? '' : 's'} found
      </p>

      <div className="plant-grid">
        {results.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>

      {results.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-xl)' }}>
          No matches. Try another name or{' '}
          <button type="button" className="btn-link" onClick={() => setQ('')}>
            clear search
          </button>
          .
        </p>
      )}
    </>
  )
}
