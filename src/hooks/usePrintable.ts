import { useCallback, useRef } from 'react'

/**
 * Hook that wires a ref to a printable document element and exposes a
 * `print()` action which temporarily marks the doc as active (via the
 * `data-print-doc-active` attribute that the print CSS keys on), calls
 * `window.print()`, and clears the flag on `afterprint`.
 *
 * Lives in its own file so `PrintableShoppingList` can use Fast Refresh
 * without tripping `react-refresh/only-export-components`.
 */
export function usePrintable() {
  const ref = useRef<HTMLElement | null>(null)

  const print = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.setAttribute('data-print-doc-active', 'true')
    const cleanup = () => {
      el.removeAttribute('data-print-doc-active')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
  }, [])

  return { ref, print }
}
