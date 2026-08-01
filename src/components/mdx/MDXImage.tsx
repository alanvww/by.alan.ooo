'use client'
import { useCallback, useState } from 'react'
import Image from 'next/image'
import { DotWavePlaceholder } from './DotWavePlaceholder'

interface MDXImageProps {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

/**
 * Post image with a dot-wave loading placeholder. The placeholder sits
 * BEHIND the image: while pixels stream in the wave shows through, and an
 * image cached before hydration simply paints over it — no flash, no hidden
 * content if JS is slow. On load the placeholder unmounts so its animation
 * stops costing anything.
 */
export function MDXImage({ src, alt, caption, width, height }: MDXImageProps) {
  const [loaded, setLoaded] = useState(false)
  const isLocal = src.startsWith('/')
  const hasDimensions = Boolean(width && height)

  // A failed load also dismisses the wave — otherwise a dead URL animates forever.
  const handleLoad = useCallback(() => setLoaded(true), [])
  // Cached images can already be complete before React attaches onLoad.
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true)
  }, [])

  const imageClass = 'relative w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity'

  return (
    <figure className="my-10 group relative rounded-xl overflow-hidden border border-xmb-fg/10 bg-xmb-fg/5 shadow-2xl transition-colors duration-150 hover:border-xmb-fg/30">
      {/* Unknown dimensions (some external URLs) get a 16:9 stage while
          loading so the wave has room; known dimensions already reserve the
          exact box via the width/height attributes. */}
      <div className={`relative ${!loaded && !hasDimensions ? 'aspect-video' : ''}`}>
        {!loaded && <DotWavePlaceholder className="absolute inset-0" />}
        {isLocal ? (
          <Image
            ref={imgRef}
            src={src}
            alt={alt}
            width={width ?? 1600}
            height={height ?? 900}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 65rem"
            className={imageClass}
            onLoad={handleLoad}
            onError={handleLoad}
          />
        ) : (
          // External images skip next/image so unconfigured hosts can't crash the render.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={imageClass}
            onLoad={handleLoad}
            onError={handleLoad}
          />
        )}
      </div>
      {caption && (
        <figcaption className="px-4 py-3 border-t border-xmb-fg/10 text-xs font-mono text-xmb-fg/50 tracking-widest uppercase">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
