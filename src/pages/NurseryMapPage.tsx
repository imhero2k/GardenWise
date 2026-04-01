import { useMemo, useState } from 'react'
import { nurseries } from '../data/nurseries'
import type { Nursery } from '../types/plant'

type Filter = 'all' | 'low' | 'nearby' | 'organic'

export function NurseryMapPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Nursery | null>(null)

  const filtered = useMemo(() => {
    const list = nurseries.filter((n) => {
      if (filter === 'low') return n.lowInvasiveFocus
      if (filter === 'organic') return n.organic
      if (filter === 'nearby') return true
      return true
    })
    if (filter === 'nearby') return list.slice(0, 3)
    return list
  }, [filter])

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Local</p>
        <h1>Nursery map</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Tap pins for details. Filters help you find responsible stockists.
        </p>
      </header>

      <div className="chip-row" style={{ marginBottom: 'var(--space-md)' }} role="tablist" aria-label="Map filters">
        {(
          [
            ['all', 'All'],
            ['low', 'Low invasive plants'],
            ['nearby', 'Nearby'],
            ['organic', 'Organic nurseries'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`chip${filter === key ? ' active' : ''}`}
            onClick={() => {
              setFilter(key)
              setSelected(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="map-frame" role="application" aria-label="Illustrative map with nursery pins">
        {filtered.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`map-pin${selected?.id === n.id ? ' map-pin--active' : ''}`}
            style={{ left: `${n.lng}%`, top: `${n.lat}%` }}
            title={n.name}
            onClick={() => setSelected(n)}
            aria-label={`${n.name}, rating ${n.rating}`}
          />
        ))}
      </div>

      <p className="map-legend">
        Illustrative map — pin positions are demo layout, not GPS coordinates.
      </p>

      {selected && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-sm)' }}>{selected.name}</h2>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.9rem' }}>{selected.address}</p>
          <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.9rem' }}>
            <a href={`tel:${selected.phone.replace(/\s/g, '')}`}>{selected.phone}</a>
          </p>
          <div className="chip-row">
            <span className="badge badge-neutral">★ {selected.rating.toFixed(1)}</span>
            {selected.organic && <span className="badge badge-low">Organic</span>}
            {selected.lowInvasiveFocus && <span className="badge badge-low">Low-invasive focus</span>}
          </div>
        </div>
      )}
    </>
  )
}
