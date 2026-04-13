/** Single serrated / jagged leaf (Weeds nav, Plant Safety Check). */
export function IconLeaf({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 4L14.5 6.5 13 8 15.5 9.5 14 11.5 16.5 12.5 15 14.5 17.5 15.5 12 17.5 6.5 15.5 9 14.5 7.5 12.5 10 11.5 8.5 9.5 11 8 9.5 6.5 12 4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 17.5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconHome({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconMap({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M9 4L4 6v14l5-2 5 2 5-2 5 2V6l-5-2-5 2-5-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 4v14l5 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M17 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M21 20v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconSprout({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 22v-8M8 14c-2-4-1-8 4-10-1 4 0 7 2 10M16 14c2-4 1-8-4-10 1 4 0 7-2 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Weed prevention — warning triangle with exclamation (Weeds page). */
export function IconPrevent({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 4.5 20.5 19.5H3.5L12 4.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconCamera({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 8h3l2-2h6l2 2h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function IconSun({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconDroplet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconHeart({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        d="M12 21s-7-4.35-7-10a4 4 0 017.5-2 4 4 0 017.5 2c0 5.65-7 10-7 10z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconComment({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6h16v10H8l-4 4V6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconShare({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 5v10M8 9l4-4 4 4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Waste / weed disposal — wheelie-bin style outline. */
export function IconBin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 21s7-4.5 7-10a7 7 0 10-14 0c0 5.5 7 10 7 10z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function IconWeatherSunny({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" fill="#F9A825" stroke="#F57F17" strokeWidth="1" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="#F57F17"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconWeatherCloudy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6.5 18h11a4 4 0 000-8h-.5a5 5 0 00-9.7 1.5A3.5 3.5 0 006.5 18z"
        fill="#ECEFF1"
        stroke="#90A4AE"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconWeatherRainy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6.5 15h11a4 4 0 000-8h-.5a5 5 0 00-9.7 1.5A3.5 3.5 0 006.5 15z"
        fill="#CFD8DC"
        stroke="#78909C"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9 19l-1 2M12 18l-1 2M15 19l-1 2"
        stroke="#42A5F5"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}
