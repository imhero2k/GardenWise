import type { JSX } from 'react'

/**
 * Line-art icons for the Learn page mechanism cards and hero chips.
 * Stroke-based, 24×24, colour from `currentColor` so they inherit the
 * surrounding `--learn-accent` tint per card.
 */

export type LearnMechIconKind =
  // Native plants 101
  | 'ecosystem'
  | 'health'
  | 'sun'
  | 'water'
  | 'community'
  | 'coin'
  // Weeds 101
  | 'displace'
  | 'cycle'
  | 'web'
  | 'wind'
  // Misc
  | 'book'

interface IconProps {
  className?: string
}

const SVG: Omit<React.SVGProps<SVGSVGElement>, 'children'> = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function Ecosystem({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12c2.5-2.5 6-3.5 8.5-3.5s6 1 8.5 3.5" />
      <path d="M3.5 12c2.5 2.5 6 3.5 8.5 3.5s6-1 8.5-3.5" />
      <path d="M12 3.5c-2.5 2.5-3.5 6-3.5 8.5s1 6 3.5 8.5" />
      <path d="M12 3.5c2.5 2.5 3.5 6 3.5 8.5s-1 6-3.5 8.5" />
    </svg>
  )
}

function Health({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M12 20.5l-7.2-7.2A4.5 4.5 0 0111.2 7l.8.8.8-.8a4.5 4.5 0 016.4 6.3L12 20.5z" />
      <path d="M6.5 13.5h2l1.3-2.2 2 4.4 1.3-2.2h4.4" />
    </svg>
  )
}

function Sun({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M5.2 18.8l1.6-1.6M17.2 6.8l1.6-1.6" />
    </svg>
  )
}

function Water({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M12 3c-3 4-6 7.2-6 11a6 6 0 0012 0c0-3.8-3-7-6-11z" />
      <path d="M9 14.5c0 1.4 1 2.5 2.4 2.7" />
    </svg>
  )
}

function Community({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M3 12l5-4.5 5 4.5v8H3z" />
      <path d="M6 20v-4h4v4" />
      <circle cx="17.5" cy="10.5" r="3.5" />
      <path d="M17.5 14v6" />
      <path d="M15.5 17.5h4" />
    </svg>
  )
}

function Coin({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <ellipse cx="12" cy="7" rx="7" ry="2.6" />
      <path d="M5 7v4.5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V7" />
      <path d="M5 11.5V16c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-4.5" />
      <path d="M10 8c1-1 3-1 4 0" />
    </svg>
  )
}

function Displace({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M9 14c-3 0-5-2-5-5 0-3 2-5 5-5 0 3-1 5 0 7" />
      <path d="M14 10c3 0 5 2 5 5 0 3-2 5-5 5 0-3 1-5 0-7" />
      <path d="M9 11l6 2" />
      <path d="M13 9l-2 2 2 2" />
    </svg>
  )
}

function Cycle({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M5.5 12a6.5 6.5 0 0111-4.7" />
      <path d="M15 4.5l1.7 2.8L13.8 8" />
      <path d="M18.5 12a6.5 6.5 0 01-11 4.7" />
      <path d="M9 19.5L7.3 16.7l2.9-.7" />
      <path d="M11 11.5l-2 1.5 1.6 1.5" />
    </svg>
  )
}

function Web({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="5" cy="11" r="1.6" />
      <circle cx="19" cy="11" r="1.6" />
      <circle cx="8" cy="18.5" r="1.6" />
      <circle cx="16" cy="18.5" r="1.6" />
      <path d="M12 6.6l-5.3 3.2M12 6.6l5.3 3.2M6.5 11.8l1.4 5.4M17.5 11.8l-1.4 5.4M9.4 18.4h5.2" />
      <path d="M12 6.6v0M8 18.5L5 11M16 18.5l3-7.5" opacity="0" />
    </svg>
  )
}

function Wind({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M3 9h11.5a2.5 2.5 0 102.5-2.5" />
      <path d="M3 14h14a2.5 2.5 0 112.5 2.5" />
      <path d="M3 19h7" />
    </svg>
  )
}

function Book({ className }: IconProps) {
  return (
    <svg className={className} {...SVG}>
      <path d="M3 5.5l9 1.5 9-1.5v13L12 20l-9-1.5z" />
      <path d="M12 7v13" />
    </svg>
  )
}

const ICONS: Record<LearnMechIconKind, (p: IconProps) => JSX.Element> = {
  ecosystem: Ecosystem,
  health: Health,
  sun: Sun,
  water: Water,
  community: Community,
  coin: Coin,
  displace: Displace,
  cycle: Cycle,
  web: Web,
  wind: Wind,
  book: Book,
}

/** Map a topic title to an icon key (substring match, case-insensitive). */
const KIND_MAP: { match: string; kind: LearnMechIconKind }[] = [
  { match: 'ecosystem', kind: 'ecosystem' },
  { match: 'health', kind: 'health' },
  { match: 'cooling', kind: 'sun' },
  { match: 'flood', kind: 'water' },
  { match: 'liveable', kind: 'community' },
  { match: 'economic', kind: 'coin' },
  { match: 'displacing', kind: 'displace' },
  { match: 'disrupting', kind: 'cycle' },
  { match: 'food web', kind: 'web' },
  { match: 'spreading', kind: 'wind' },
  { match: 'what is', kind: 'book' },
]

export function learnIconKindFor(title: string): LearnMechIconKind {
  const t = title.toLowerCase()
  for (const e of KIND_MAP) {
    if (t.includes(e.match)) return e.kind
  }
  return 'ecosystem'
}

export function LearnMechIcon({
  kind,
  className,
}: {
  kind: LearnMechIconKind
  className?: string
}) {
  const C = ICONS[kind]
  return <C className={className} />
}
