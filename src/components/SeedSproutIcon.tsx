import { useEffect, useRef, useState } from 'react'
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
 * cart. The transition is purely CSS so it's cheap and respects
 * `prefers-reduced-motion`.
 */
export function SeedSproutIcon({ saved, className, size = 22, burst = false }: Props) {
  const [justToggled, setJustToggled] = useState(false)
  const [bursting, setBursting] = useState(false)
  const prevSavedRef = useRef(saved)
  const popTimerRef = useRef<number | null>(null)
  const burstTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const prev = prevSavedRef.current
    prevSavedRef.current = saved
    if (prev === saved) return

    setJustToggled(true)
    if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current)
    popTimerRef.current = window.setTimeout(() => setJustToggled(false), 500)

    if (burst && saved) {
      setBursting(true)
      if (burstTimerRef.current !== null) window.clearTimeout(burstTimerRef.current)
      burstTimerRef.current = window.setTimeout(() => setBursting(false), 600)
    }

    return () => {
      if (popTimerRef.current !== null) window.clearTimeout(popTimerRef.current)
      if (burstTimerRef.current !== null) window.clearTimeout(burstTimerRef.current)
    }
  }, [saved, burst])

  const rootClass = [
    'seed-sprout',
    saved ? 'seed-sprout--saved' : '',
    justToggled ? 'seed-sprout--just-toggled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const svg = (
    <svg
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
    <span
      style={{ position: 'relative', display: 'inline-flex', lineHeight: 0 }}
    >
      <span
        aria-hidden
        className={`seed-sprout-burst${bursting ? ' seed-sprout-burst--active' : ''}`}
      />
      {svg}
    </span>
  )
}
