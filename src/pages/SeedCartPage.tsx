import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBin, IconPrinter, IconSeedling } from '../components/Icons'
import {
  PrintableShoppingList,
  type PrintItem,
} from '../components/PrintableShoppingList'
import { usePrintable } from '../hooks/usePrintable'
import { SeedSproutIcon } from '../components/SeedSproutIcon'
import { useLocationArea } from '../context/LocationContext'
import { useSeedCart } from '../context/useSeedCart'
import type { SeedCartItemV1 } from '../context/seedCartTypes'
import { LF_CODE_LABELS } from '../lib/lfCodeLabels'

function formatAddedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function SeedCartCard({
  item,
  onRemove,
}: {
  item: SeedCartItemV1
  onRemove: (id: string) => void
}) {
  const title = item.commonName?.trim() || item.scientificName || 'Plant'
  const showSci =
    item.commonName && item.scientificName &&
    item.commonName.trim().toLowerCase() !== item.scientificName.trim().toLowerCase()
  const lf = item.lfCode ? LF_CODE_LABELS[item.lfCode] ?? item.lfCode : null
  const added = formatAddedAt(item.addedAt)

  return (
    <article
      className="card"
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr auto',
        gap: 'var(--space-md)',
        alignItems: 'center',
        padding: 'var(--space-md)',
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--color-surface-alt, #eef2ee)',
          flexShrink: 0,
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <IconSeedling />
          </div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <Link
          to={`/plants/${encodeURIComponent(item.id)}`}
          style={{
            fontWeight: 600,
            color: 'var(--color-text)',
            textDecoration: 'none',
            fontSize: '1rem',
            display: 'block',
          }}
        >
          {title}
        </Link>
        {showSci && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
              margin: '0.15rem 0 0',
            }}
          >
            {item.scientificName}
          </p>
        )}
        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-text-muted)',
            margin: '0.35rem 0 0',
          }}
        >
          {lf ? <>Plant type: {lf}</> : null}
          {lf && added ? ' · ' : ''}
          {added ? <>Added {added}</> : null}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="btn btn-ghost"
        aria-label={`Remove ${title} from seed cart`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.4rem 0.6rem',
          color: 'var(--color-danger, #b3261e)',
        }}
      >
        <IconBin />
        <span style={{ fontSize: '0.85rem' }}>Remove</span>
      </button>
    </article>
  )
}

export function SeedCartPage() {
  const { items, remove, clear, count } = useSeedCart()
  const { areaLabel, placeLabel } = useLocationArea()
  const [confirmClear, setConfirmClear] = useState(false)
  const printable = usePrintable()

  const printItems: PrintItem[] = items.map((it) => ({
    commonName: it.commonName ?? null,
    scientificName: it.scientificName ?? null,
    kind: it.lfCode ? LF_CODE_LABELS[it.lfCode] ?? it.lfCode : null,
    qty: 1,
    note: it.lfCode ? `LF ${it.lfCode}` : null,
  }))

  return (
    <>
      <header className="page-header">
        <p className="eyebrow">PlantMe</p>
        <h1
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            margin: 0,
          }}
        >
          <SeedSproutIcon saved size={28} />
          Seed cart
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 'var(--space-xs) 0 0' }}>
          Plants you’re tracking to grow or sow.{' '}
          {count > 0 ? (
            <>
              <strong>{count}</strong> saved on this device.
            </>
          ) : (
            'Bookmark plants from PlantMe to build your list.'
          )}
        </p>
      </header>

      {count === 0 ? (
        <section
          className="card card-body"
          style={{
            textAlign: 'center',
            padding: 'var(--space-xl)',
            display: 'grid',
            gap: 'var(--space-md)',
            justifyItems: 'center',
          }}
        >
          <span style={{ color: 'var(--color-primary)', fontSize: '2rem', lineHeight: 1 }}>
            <IconSeedling />
          </span>
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>No seeds tracked yet</h2>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', maxWidth: '32ch' }}>
            Browse plants on PlantMe and tap the bookmark to add them to your seed cart.
          </p>
          <Link to="/plants" className="btn btn-primary">
            Browse PlantMe
          </Link>
        </section>
      ) : (
        <section style={{ display: 'grid', gap: 'var(--space-md)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-sm)',
              flexWrap: 'wrap',
            }}
          >
            {!confirmClear ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={printable.print}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  aria-label="Print or save seed cart as PDF"
                >
                  <IconPrinter />
                  Print / Save as PDF
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmClear(true)}
                >
                  Clear all
                </button>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    alignSelf: 'center',
                  }}
                >
                  Remove all {count} item{count === 1 ? '' : 's'}?
                </span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    clear()
                    setConfirmClear(false)
                  }}
                  style={{ background: 'var(--color-danger, #b3261e)', borderColor: 'transparent' }}
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gap: 'var(--space-sm)' }}>
            {items.map((it) => (
              <SeedCartCard key={it.id} item={it} onRemove={remove} />
            ))}
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              margin: 'var(--space-sm) 0 0',
              textAlign: 'center',
            }}
          >
            Your seed cart is saved in this browser only. Clearing site data will remove it.
          </p>
        </section>
      )}

      <PrintableShoppingList
        docRef={printable.ref}
        title="Seed shopping list"
        subtitle="Plants saved from PlantMe to take to your nursery"
        meta={[
          { label: 'Location', value: placeLabel ?? areaLabel },
          { label: 'Items', value: String(count) },
        ]}
        items={printItems}
        columns={{ qty: true, kind: true, note: true }}
      />
    </>
  )
}
