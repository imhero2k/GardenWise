import {
  WILDLIFE_CATEGORY_OPTIONS,
  type WildlifeCategory,
} from '../lib/recommendationsApi'

type Props = {
  value: ReadonlyArray<WildlifeCategory>
  onChange: (next: WildlifeCategory[]) => void
  disabled?: boolean
  className?: string
  legend?: string
}

/**
 * Multi-select chip group for wildlife the user wants the recommended plants to attract.
 * Renders as a `<fieldset>` of toggle buttons so it's keyboard- and screen-reader-friendly.
 */
export function WildlifeFilter({
  value,
  onChange,
  disabled = false,
  className,
  legend = 'Attracts wildlife',
}: Props) {
  const selected = new Set<WildlifeCategory>(value)

  const toggle = (id: WildlifeCategory) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(WILDLIFE_CATEGORY_OPTIONS.map((o) => o.id).filter((o) => next.has(o)))
  }

  return (
    <fieldset
      className={className}
      style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      disabled={disabled}
    >
      <legend
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-xs, 0.35rem)',
        }}
      >
        {legend}
      </legend>
      <div className="chip-row" role="group" aria-label={legend}>
        {WILDLIFE_CATEGORY_OPTIONS.map((opt) => {
          const isOn = selected.has(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              className="chip"
              aria-pressed={isOn}
              onClick={() => toggle(opt.id)}
            >
              {opt.label}
            </button>
          )
        })}
        {selected.size > 0 && (
          <button
            type="button"
            className="chip"
            onClick={() => onChange([])}
            aria-label="Clear wildlife filter"
            style={{ borderStyle: 'dashed' }}
          >
            Clear
          </button>
        )}
      </div>
    </fieldset>
  )
}
