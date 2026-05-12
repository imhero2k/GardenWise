import { useEffect, useRef, useState } from 'react'

export type ScrollRevealVariant =
  | 'fade-up'
  | 'fade-in'
  | 'slide-left'
  | 'slide-right'
  /** Slight scale + lift; feels “editorial” / portfolio sites */
  | 'rise-scale'

/**
 * Adds `reveal-on-scroll` classes; toggles visible when the element enters the viewport.
 * Respects `prefers-reduced-motion: reduce`.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  variant: ScrollRevealVariant = 'fade-up',
) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const revealClass = `reveal-on-scroll reveal-on-scroll--${variant}${
    visible ? ' reveal-on-scroll--visible' : ''
  }`

  return { ref, revealClass, visible }
}
