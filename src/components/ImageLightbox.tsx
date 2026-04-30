import { useCallback, useEffect, useId, useRef } from 'react'

export function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string | null
  alt?: string
  open: boolean
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open) {
      if (!d.open) d.showModal()
    } else {
      if (d.open) d.close()
    }
  }, [open])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!src) return null

  return (
    <dialog
      ref={dialogRef}
      className="plant-detail-dialog"
      aria-labelledby={titleId}
      onClose={handleClose}
    >
      <div className="plant-detail-dialog__inner">
        <header className="plant-detail-dialog__header">
          <h2 id={titleId} className="plant-detail-dialog__title">
            Image
          </h2>
          <button
            type="button"
            className="plant-detail-dialog__close"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="plant-detail-dialog__body">
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <img
              src={src}
              alt={alt ?? ''}
              style={{ width: '100%', height: 'auto', maxHeight: '75vh', objectFit: 'contain' }}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </dialog>
  )
}

