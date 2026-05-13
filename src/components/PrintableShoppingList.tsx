import { createPortal } from 'react-dom'

/**
 * Printable shopping/plant list rendered into a portal under `<body>`.
 *
 * On screen the document is hidden (`.print-doc` is `display: none`).
 * When the consumer calls `print()` from `usePrintable()` (see
 * `../hooks/usePrintable`), the hook flips a `data-print-doc-active="true"`
 * attribute on the doc, calls `window.print()`, and clears the attribute on
 * `afterprint`. The accompanying `@media print` rules hide the rest of the
 * app and show only the active doc, giving users a clean shopping list
 * they can take to a nursery or save as PDF via the browser's print
 * dialog.
 */
export type PrintItem = {
  commonName: string | null
  scientificName: string | null
  /** Display label for the kind/form column (e.g. "Tree", "Insect hotel"). */
  kind?: string | null
  qty?: number
  /** Free-form notes column (e.g. life-form code, planter feedback). */
  note?: string | null
}

export type PrintMeta = { label: string; value: string }

type Props = {
  docRef: React.RefObject<HTMLElement | null>
  title: string
  subtitle?: string
  meta?: PrintMeta[]
  items: PrintItem[]
  footer?: string
  /** Optional column visibility overrides. */
  columns?: {
    qty?: boolean
    kind?: boolean
    note?: boolean
  }
}

const DEFAULT_FOOTER =
  'Take this list to your local Victorian indigenous nursery. Quantities are a planning guide — substitute with locally indigenous species where possible.'

export function PrintableShoppingList({
  docRef,
  title,
  subtitle,
  meta = [],
  items,
  footer,
  columns,
}: Props) {
  const showQty = columns?.qty ?? true
  const showKind = columns?.kind ?? true
  const showNote = columns?.note ?? true
  const generated = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return createPortal(
    <section ref={docRef} className="print-doc" aria-hidden>
      <header className="print-doc__head">
        <p className="print-doc__brand">RootVio · GardenWise</p>
        <h1 className="print-doc__title">{title}</h1>
        {subtitle ? <p className="print-doc__subtitle">{subtitle}</p> : null}
        <p className="print-doc__date">Generated {generated}</p>
      </header>

      {meta.length > 0 ? (
        <dl className="print-doc__meta">
          {meta.map((m) => (
            <div key={m.label} className="print-doc__meta-row">
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <table className="print-doc__table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th>Plant</th>
            <th>Scientific name</th>
            {showKind ? <th>Form</th> : null}
            {showQty ? <th className="print-doc__num">Qty</th> : null}
            {showNote ? <th>Notes</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={`${it.commonName ?? ''}-${it.scientificName ?? ''}-${i}`}>
              <td>{i + 1}</td>
              <td>{it.commonName?.trim() || '—'}</td>
              <td className="print-doc__sci">{it.scientificName ?? ''}</td>
              {showKind ? <td>{it.kind ?? ''}</td> : null}
              {showQty ? <td className="print-doc__num">{it.qty ?? 1}</td> : null}
              {showNote ? <td>{it.note ?? ''}</td> : null}
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={3 + (showKind ? 1 : 0) + (showQty ? 1 : 0) + (showNote ? 1 : 0)}
                style={{ textAlign: 'center', color: '#666' }}
              >
                No items.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <footer className="print-doc__footer">
        <p>{footer ?? DEFAULT_FOOTER}</p>
        <p className="print-doc__brandline">rootvio.app</p>
      </footer>
    </section>,
    document.body,
  )
}
