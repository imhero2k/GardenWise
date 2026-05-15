import { useCallback, useState } from 'react'
import type { TutorialMedia } from '../pages/beginners/tutorials'
import { ImageLightbox } from './ImageLightbox'

export function BeginnerTutorialMedia({ media }: { media: TutorialMedia[] }) {
  const [enlarged, setEnlarged] = useState<TutorialMedia | null>(null)
  const closeLightbox = useCallback(() => setEnlarged(null), [])

  return (
    <>
      <div
        className={`beginner-media${media.length === 2 ? ' beginner-media--two' : ''}`}
        aria-label="Illustrations"
      >
        {media.map((m) => (
          <figure key={m.caption} className="beginner-media__figure">
            <button
              type="button"
              className="beginner-media__zoom"
              onClick={() => setEnlarged(m)}
              aria-label={`View larger image: ${m.alt}`}
            >
              <img src={m.src} alt={m.alt} className="beginner-media__img" loading="lazy" />
              <span className="beginner-media__zoom-hint" aria-hidden="true">
                Tap to enlarge
              </span>
            </button>
            <figcaption className="beginner-media__caption">{m.caption}</figcaption>
          </figure>
        ))}
      </div>
      <ImageLightbox
        src={enlarged?.src ?? null}
        alt={enlarged?.alt}
        title={enlarged?.caption}
        open={enlarged != null}
        onClose={closeLightbox}
      />
    </>
  )
}
