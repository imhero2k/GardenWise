import type { CSSProperties } from 'react'
import type { PlantForm } from '../data/plantSpecs'

/**
 * Small pictogram for a plant's growth form (tree, shrub, grass, etc.),
 * tinted in the plant's canopy color. Used in the planner catalog and goal
 * recommendation slots so users get an at-a-glance hint of the plant shape
 * without needing real photography for every species.
 *
 * Renders inside a rounded tile whose background is a low-alpha wash of the
 * canopy color, with the pictogram itself drawn in the same color for high
 * contrast against the wash.
 */
const TRUNK_COLOR = '#8b5a2b'

type Props = {
  form: PlantForm
  color: string
  size?: number
  className?: string
  /** If true, renders without the tinted background tile (useful inline). */
  bare?: boolean
}

export function PlantFormIcon({ form, color, size = 36, className, bare = false }: Props) {
  const wrapperStyle: CSSProperties = bare
    ? { display: 'inline-flex', width: size, height: size, color }
    : {
        display: 'inline-flex',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color,
        flexShrink: 0,
      }
  return (
    <span className={className} style={wrapperStyle} aria-hidden>
      <svg
        width={Math.round(size * 0.78)}
        height={Math.round(size * 0.78)}
        viewBox="0 0 24 24"
        fill="none"
      >
        {renderForm(form)}
      </svg>
    </span>
  )
}

function renderForm(form: PlantForm) {
  switch (form) {
    case 'tree':
      return (
        <>
          <rect x="11" y="13" width="2" height="8" rx="0.6" fill={TRUNK_COLOR} />
          <path
            d="M12 2.5 C 16.5 4, 19 7.5, 19 11 C 19 14, 16 15.6, 12 15.6 C 8 15.6, 5 14, 5 11 C 5 7.5, 7.5 4, 12 2.5 Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </>
      )
    case 'shrub':
      return (
        <>
          <line
            x1="3"
            y1="20.4"
            x2="21"
            y2="20.4"
            stroke={TRUNK_COLOR}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="6.5" cy="14.5" r="4.2" fill="currentColor" />
          <circle cx="17.5" cy="14.5" r="4.2" fill="currentColor" />
          <circle cx="12" cy="11" r="5.5" fill="currentColor" />
        </>
      )
    case 'grass':
      return (
        <>
          <line
            x1="2"
            y1="21"
            x2="22"
            y2="21"
            stroke={TRUNK_COLOR}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M4 21 C 4 16, 5 12, 6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M9 21 C 9 16, 9.5 11, 10 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M14 21 C 14 16, 14.5 11, 15 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M19 21 C 19 16, 19.5 12, 20 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )
    case 'groundcover':
      return (
        <>
          <line
            x1="2"
            y1="21"
            x2="22"
            y2="21"
            stroke={TRUNK_COLOR}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <ellipse cx="12" cy="17.5" rx="9.5" ry="2.6" fill="currentColor" />
          <circle cx="6" cy="14" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2.8" fill="currentColor" />
          <circle cx="18" cy="14" r="2" fill="currentColor" />
        </>
      )
    case 'climber':
      return (
        <>
          <line
            x1="12"
            y1="21"
            x2="12"
            y2="3.5"
            stroke={TRUNK_COLOR}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M12 17 Q 6 17, 5 12.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M12 11.5 Q 18 11.5, 19 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M12 6.5 Q 7 5.8, 6 2.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="5" cy="12.5" r="1.7" fill="currentColor" />
          <circle cx="19" cy="7" r="1.7" fill="currentColor" />
          <circle cx="6" cy="2.6" r="1.5" fill="currentColor" />
        </>
      )
    default:
      return <circle cx="12" cy="12" r="6.5" fill="currentColor" />
  }
}
