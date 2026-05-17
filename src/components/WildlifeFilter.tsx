import type { CSSProperties } from 'react'
import {
  WILDLIFE_CATEGORY_OPTIONS,
  type WildlifeCategory,
} from '../lib/recommendationsApi'
import { WILDLIFE_VISUALS } from '../lib/wildlifeVisuals'

type Props = {
  value: ReadonlyArray<WildlifeCategory>
  onChange: (next: WildlifeCategory[]) => void
  disabled?: boolean
  className?: string
}

/**
 * Multi-select card picker — filters recommendations by birds, insects, or mammals.
 */
export function WildlifeFilter({ value, onChange, disabled = false, className }: Props) {
  const selected = new Set<WildlifeCategory>(value)

  const toggle = (id: WildlifeCategory) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(WILDLIFE_CATEGORY_OPTIONS.map((o) => o.id).filter((o) => next.has(o)))
  }

  const summary =
    selected.size === 0
      ? 'Showing all visitors'
      : selected.size === 3
        ? 'Birds, insects & mammals'
        : WILDLIFE_CATEGORY_OPTIONS.filter((o) => selected.has(o.id))
            .map((o) => WILDLIFE_VISUALS[o.id].label)
            .join(' · ')

  return (
    <fieldset
      className={['wildlife-picker', className].filter(Boolean).join(' ')}
      disabled={disabled}
    >
      <legend className="wildlife-picker__legend">
        <span className="wildlife-picker__eyebrow">Sort & filter</span>
        <span className="wildlife-picker__title">Who visits your garden?</span>
        <span className="wildlife-picker__hint">
          Pick birds, insects, or mammals — we&apos;ll surface plants that support them.
        </span>
      </legend>

      <div className="wildlife-picker__grid" role="group" aria-label="Filter by garden visitors">
        {WILDLIFE_CATEGORY_OPTIONS.map((opt) => {
          const isOn = selected.has(opt.id)
          const visual = WILDLIFE_VISUALS[opt.id]
          const Icon = visual.Icon
          return (
            <button
              key={opt.id}
              type="button"
              className={`wildlife-picker__card${isOn ? ' wildlife-picker__card--on' : ''}`}
              aria-pressed={isOn}
              onClick={() => toggle(opt.id)}
              style={
                {
                  '--wildlife-accent': visual.color,
                } as CSSProperties
              }
            >
              <span className="wildlife-picker__icon" aria-hidden>
                <Icon size={28} />
              </span>
              <span className="wildlife-picker__label">{visual.label}</span>
              <span className="wildlife-picker__tagline">{visual.tagline}</span>
              <span className="wildlife-picker__examples">{visual.examples}</span>
            </button>
          )
        })}
      </div>

      <div className="wildlife-picker__footer">
        <p className="wildlife-picker__status" aria-live="polite">
          {summary}
        </p>
        {selected.size > 0 && (
          <button
            type="button"
            className="wildlife-picker__clear"
            onClick={() => onChange([])}
          >
            Clear selection
          </button>
        )}
      </div>
    </fieldset>
  )
}
