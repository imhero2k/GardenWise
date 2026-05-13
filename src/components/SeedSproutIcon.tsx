import { useEffect, useRef } from 'react'
import './SeedSproutIcon.css'

interface Props {
  /** When true, the seed sprouts into a two-leaf seedling. */
  saved: boolean
  className?: string
  /** Pixel size of the icon; defaults to 22. */
  size?: number
  /** Show a brief radial burst behind the icon when `saved` flips true. */
  burst?: boolean
}

/**
 * A creative, on-theme replacement for a bookmark icon: a buried seed that
 * sprouts two cotyledon leaves when the user "saves" a plant to their seed
 * cart. The "just toggled" pop and the radial burst are one-shot CSS
 * animations triggered by adding a class to the DOM via refs — kept out of
 * React state so the `react-hooks/set-state-in-effect` rule is satisfied.
 *
 * The persistent `seed-sprout--saved` class is derived from the `saved` prop
 * directly (no state), so React fully drives the steady-state styling.
 *
 * Respects `prefers-reduced-motion` via the CSS file.
 */
export function SeedSproutIcon({ saved, className, size = 22, burst = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const burstRef = useRef<HTMLSpanElement>(null)
  const prevSavedRef = useRef(saved)

  useEffect(() => {
    const prev = prevSavedRef.current
    prevSavedRef.current = saved
    if (prev === saved) return

    const timers: number[] = []

    /* Bounce pop on the icon, every toggle. */
    const svg = svgRef.current
    if (svg) {
      svg.classList.add('seed-sprout--just-toggled')
      timers.push(
        window.setTimeout(() => {
          svg.classList.remove('seed-sprout--just-toggled')
        }, 500),
      )
    }

    /* Radial burst only when newly saved (not when un-saving). */
    if (burst && saved) {
      const el = burstRef.current
      if (el) {
        el.classList.add('seed-sprout-burst--active')
        timers.push(
          window.setTimeout(() => {
            el.classList.remove('seed-sprout-burst--active')
          }, 600),
        )
      }
    }

    return () => {
      for (const t of timers) window.clearTimeout(t)
    }
  }, [saved, burst])

  const rootClass = ['seed-sprout', saved ? 'seed-sprout--saved' : '', className ?? '']
    .filter(Boolean)
    .join(' ')

  const svg = (
    <svg
      ref={svgRef}
      className={rootClass}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden
    >
      {/* Soil mound — always visible, gives the icon a grounded base. */}
      <path
        className="seed-sprout__soil"
        d="M3.5 19 Q 12 17.2 20.5 19 L 20.5 21 L 3.5 21 Z"
      />

      {/* Seed body — buried at the bottom, half showing above the soil. */}
      <ellipse className="seed-sprout__seed" cx="12" cy="17.4" rx="3.4" ry="2.4" />
      <ellipse
        className="seed-sprout__highlight"
        cx="10.6"
        cy="16.6"
        rx="0.9"
        ry="0.5"
      />

      {/* Stem — grows up out of the seed when saved. */}
      <path className="seed-sprout__stem" d="M12 16.5 V 8" />

      {/* Cotyledon leaves — two simple teardrops, mirrored. */}
      <path
        className="seed-sprout__leaf seed-sprout__leaf--left"
        d="M12 13 C 8 12.5, 6.5 9, 6.5 6.5 C 9.5 7.5, 11.5 10.5, 12 13 Z"
      />
      <path
        className="seed-sprout__leaf seed-sprout__leaf--right"
        d="M12 13 C 16 12.5, 17.5 9, 17.5 6.5 C 14.5 7.5, 12.5 10.5, 12 13 Z"
      />
    </svg>
  )

  if (!burst) return svg

  return (
    <span style={{ position: 'relative', display: 'inline-flex', lineHeight: 0 }}>
      <span aria-hidden ref={burstRef} className="seed-sprout-burst" />
      {svg}
    </span>
  )
}
