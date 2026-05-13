import { useCallback, useRef, useState } from 'react'

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
 *
 * Uses a callback ref as `elementRef` (not `ref`) so callers avoid `react-hooks/refs`
 * false positives when combining ref + className in JSX.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  variant: ScrollRevealVariant = 'fade-up',
) {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback((el: T | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!el) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      queueMicrotask(() => {
        setVisible(true)
      })
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

    observerRef.current = obs
    obs.observe(el)
  }, [])

  const revealClass = `reveal-on-scroll reveal-on-scroll--${variant}${
    visible ? ' reveal-on-scroll--visible' : ''
  }`

  return { elementRef: ref, revealClass, visible }
}
