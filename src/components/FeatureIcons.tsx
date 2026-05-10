import type { FeatureKind } from '../data/featureSpecs'

interface IconProps {
  className?: string
}

const SVG_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
} as const

function NestBoxIcon({ className }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <path d="M5 9l7-5 7 5v10a1 1 0 01-1 1H6a1 1 0 01-1-1V9z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 14.6V18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function InsectHotelIcon({ className }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="1"
        stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 9h15M4.5 13.5h15M4.5 17h15"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 9v8.5M14 9v8.5"
        stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
    </svg>
  )
}

function RockPileIcon({ className }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <path d="M3 18c2-1 3-3 6-3s4 2 6 2 4-2 6-1"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="9" cy="14" rx="3" ry="2"
        stroke="currentColor" strokeWidth="1.3" />
      <ellipse cx="15" cy="13" rx="3.5" ry="2.4"
        stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

function LogPileIcon({ className }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <rect x="3.5" y="9" width="17" height="3.4" rx="1.2"
        stroke="currentColor" strokeWidth="1.4" />
      <rect x="3.5" y="13.4" width="17" height="3.4" rx="1.2"
        stroke="currentColor" strokeWidth="1.4" />
      <circle cx="6" cy="10.7" r="0.6" fill="currentColor" />
      <circle cx="6" cy="15.1" r="0.6" fill="currentColor" />
    </svg>
  )
}

function BirdBathIcon({ className }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <path d="M5 9h14a0 0 0 010 0c0 2.5-3 4.5-7 4.5S5 11.5 5 9z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 13.5V20M9 20h6"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 9c0-1 1-2 3-2s3 1 3 2"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ShallowDishIcon({ className }: IconProps) {
  return (
    <svg className={className} {...SVG_PROPS}>
      <ellipse cx="12" cy="14" rx="8" ry="2.6"
        stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 14c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5"
        stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 12c0.6-0.6 2.8-0.6 4 0"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

const ICONS: Record<FeatureKind, (props: IconProps) => JSX.Element> = {
  nestBox: NestBoxIcon,
  insectHotel: InsectHotelIcon,
  rockPile: RockPileIcon,
  logPile: LogPileIcon,
  birdBath: BirdBathIcon,
  shallowDish: ShallowDishIcon,
}

export function FeatureIcon({
  kind,
  className,
}: {
  kind: FeatureKind
  className?: string
}) {
  const C = ICONS[kind]
  return <C className={className} />
}
