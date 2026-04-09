import { useMemo, useState } from 'react'
import { NurseryLeafletMap } from '../components/NurseryLeafletMap'
import { useLocationArea } from '../context/LocationContext'
import { haversineKm } from '../lib/geo'
import { nurseries } from '../data/nurseries'
import type { Nursery } from '../types/plant'

type Filter = 'all' | 'nursery' | 'garden' | 'nearby'

function formatDescriptionHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export function NurseryMapPage() {
  const { areaLabel, regionCode, coords } = useLocationArea()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Nursery | null>(null)
  const [listOpen, setListOpen] = useState(true)

  const filtered = useMemo(() => {
    if (filter === 'nearby') {
      if (coords) {
        return [...nurseries]
          .map((n) => ({ n, d: haversineKm(coords.lat, coords.lng, n.lat, n.lng) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 14)
          .map((x) => x.n)
      }
      return nurseries.slice(0, 12)
    }

    return nurseries.filter((n) => {
      if (filter === 'nursery') return n.kind === 'nursery'
      if (filter === 'garden') return n.kind === 'public_garden'
      return true
    })
  }, [filter, coords])

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">Local</p>
        <h1>Nurseries &amp; public gardens</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
          Victorian native plant nurseries and public gardens from the{' '}
          <a href="https://apsvic.org.au/nurseries-and-public-gardens/" target="_blank" rel="noreferrer">
            APS Victoria
          </a>{' '}
          map layer (non-comprehensive). Website links come from that layer where provided; some Google Maps
          details are not in the export.
          {regionCode ? (
            <>
              {' '}
              Area focus: <strong style={{ color: 'var(--color-text)' }}>{areaLabel}</strong>.
            </>
          ) : (
            ' Set your area and use GPS for “Nearby” sorting.'
          )}
        </p>
      </header>

      <div className="chip-row" style={{ marginBottom: 'var(--space-md)' }} role="tablist" aria-label="Map filters">
        {(
          [
            ['all', 'All'],
            ['nursery', 'Nurseries'],
            ['garden', 'Public gardens'],
            ['nearby', 'Nearby'],
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

      <p className="map-hint" style={{ marginTop: 0, marginBottom: 'var(--space-md)' }}>
        <strong>Map:</strong> double-click to zoom in, or use the +/− control at the{' '}
        <strong>bottom left</strong> of the map. Tap a pin or choose a name in the list for details.
      </p>

      <div className="nursery-map-layout">
        <div className="nursery-map-pane">
          <NurseryLeafletMap items={filtered} selected={selected} onSelect={setSelected} />
        </div>

        <aside className="nursery-map-sidebar" aria-label="Nursery and garden list">
          <button
            type="button"
            className="nursery-list-toggle"
            aria-expanded={listOpen}
            onClick={() => setListOpen((o) => !o)}
          >
            <span className="nursery-list-toggle__label">
              {listOpen ? 'Hide list' : 'Show list'}
            </span>
            <span className="nursery-list-toggle__meta">{filtered.length} places</span>
            <span className={`nursery-list-toggle__chevron${listOpen ? ' nursery-list-toggle__chevron--open' : ''}`} aria-hidden />
          </button>

          {listOpen && (
            <ul className="nursery-list">
              {filtered.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`nursery-list__item${selected?.id === n.id ? ' nursery-list__item--active' : ''}`}
                    onClick={() => setSelected(n)}
                  >
                    <span className="nursery-list__name">{n.name}</span>
                    <span className="nursery-list__tags">
                      {n.kind === 'public_garden' && <span className="badge badge-neutral">Garden</span>}
                      {n.websites && n.websites.length > 0 && (
                        <span className="badge badge-neutral">Web</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <p className="map-legend">
        Map data &copy;{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>

      {selected && (
        <div className="card card-body fade-up" style={{ marginTop: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-sm)' }}>{selected.name}</h2>

          {selected.description && (
            <p
              style={{
                margin: '0 0 var(--space-sm)',
                fontSize: '0.9rem',
                whiteSpace: 'pre-line',
                color: 'var(--color-text-muted)',
              }}
            >
              {formatDescriptionHtml(selected.description)}
            </p>
          )}

          {selected.websites && selected.websites.length > 0 && (
            <ul className="nursery-detail-links">
              {selected.websites.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {selected.phone && (
            <p style={{ margin: '0 0 var(--space-sm)', fontSize: '0.9rem' }}>
              <a href={`tel:${selected.phone.replace(/\s/g, '')}`}>{selected.phone}</a>
            </p>
          )}

          <div className="chip-row">
            {selected.rating != null && (
              <span className="badge badge-neutral">★ {selected.rating.toFixed(1)}</span>
            )}
            {selected.kind === 'public_garden' && <span className="badge badge-neutral">Public garden</span>}
            {selected.organic && <span className="badge badge-low">Organic</span>}
            {selected.lowInvasiveFocus && <span className="badge badge-low">Low-invasive focus</span>}
          </div>
        </div>
      )}
    </>
  )
}
