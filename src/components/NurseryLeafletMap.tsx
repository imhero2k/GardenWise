import { useEffect, useLayoutEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Nursery } from '../types/plant'

const NURSERY_FILL = '#2e7d32'
const NURSERY_ACTIVE = '#1b5e20'
const GARDEN_FILL = '#1565c0'
const GARDEN_ACTIVE = '#0d47a1'

function fillsFor(n: { kind: 'nursery' | 'public_garden' }) {
  return n.kind === 'public_garden'
    ? { fill: GARDEN_FILL, active: GARDEN_ACTIVE }
    : { fill: NURSERY_FILL, active: NURSERY_ACTIVE }
}

type Props = {
  items: Nursery[]
  selected: Nursery | null
  onSelect: (n: Nursery) => void
}

export function NurseryLeafletMap({ items, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const onSelectRef = useRef(onSelect)
  const selectedRef = useRef(selected)

  useLayoutEffect(() => {
    onSelectRef.current = onSelect
    selectedRef.current = selected
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
    }).setView([-37.8, 145], 7)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    mapRef.current = map

    const invalidate = () => {
      map.invalidateSize()
    }
    invalidate()
    const t = window.setTimeout(invalidate, 100)

    const ro = new ResizeObserver(() => {
      invalidate()
    })
    ro.observe(el)

    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    const selId = selectedRef.current?.id

    items.forEach((n) => {
      const isSel = n.id === selId
      const { fill, active } = fillsFor(n)
      const cm = L.circleMarker([n.lat, n.lng], {
        radius: isSel ? 11 : 9,
        weight: 2,
        color: '#fff',
        fillColor: isSel ? active : fill,
        fillOpacity: 0.95,
      }).addTo(map)

      cm.on('click', () => {
        onSelectRef.current(n)
      })
      cm.bindTooltip(n.name, { direction: 'top', offset: [0, -8] })
      markersRef.current.set(n.id, cm)
    })

    const applyView = () => {
      map.invalidateSize()
      if (items.length > 0) {
        const bounds = L.latLngBounds(items.map((n) => [n.lat, n.lng] as L.LatLngExpression))
        map.fitBounds(bounds.pad(0.12))
      } else {
        map.setView([-37.8, 145], 7)
      }
    }
    applyView()
    const t = window.requestAnimationFrame(() => {
      applyView()
    })
    return () => window.cancelAnimationFrame(t)
  }, [items])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m, id) => {
      const item = items.find((x) => x.id === id)
      if (!item) return
      const isSel = selected?.id === id
      const { fill, active } = fillsFor(item)
      m.setStyle({
        radius: isSel ? 11 : 9,
        fillColor: isSel ? active : fill,
      })
    })

    if (selected) {
      map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 11), { duration: 0.35 })
    }
  }, [selected, items])

  return <div ref={containerRef} className="nursery-leaflet-map" role="presentation" />
}
