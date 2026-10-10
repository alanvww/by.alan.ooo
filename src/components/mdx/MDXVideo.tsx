'use client'

import { useCallback, useState } from 'react'
import { DotWavePlaceholder } from './DotWavePlaceholder'

export interface MDXVideoProps {
  src: string
  alt?: string
  caption?: string
  poster?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  playsInline?: boolean
}

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (parsed.hostname.includes('vimeo.com') && !parsed.hostname.includes('player.vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    return null
  }
  return null
}

/**
 * Portfolio video figure with dot-wave loading placeholder and XMB chrome.
 * Supports local colocated videos (/content/...), direct video URLs, and
 * YouTube/Vimeo links. Defaults to silent looping playback for demos.
 */
export function MDXVideo({
  src,
  alt,
  caption,
  poster,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  playsInline = true,
}: MDXVideoProps) {
  const [loaded, setLoaded] = useState(false)
  const handleLoaded = useCallback(() => setLoaded(true), [])
  const videoRef = useCallback((node: HTMLVideoElement | null) => {
    if (node && node.readyState >= 2) setLoaded(true)
  }, [])

  const embedUrl = !src.startsWith('/') ? getEmbedUrl(src) : null

  return (
    <figure className="my-10 group relative rounded-xl overflow-hidden border border-xmb-fg/10 bg-xmb-fg/5 shadow-2xl transition-colors duration-250 hover:border-xmb-fg/30">
      <div className={`relative ${!loaded || embedUrl ? 'aspect-video' : ''}`}>
        {!loaded && <DotWavePlaceholder className="absolute inset-0" />}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={alt || caption || 'Embedded video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoaded}
            className="relative w-full h-full border-0"
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            aria-label={alt || caption || undefined}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            controls={controls}
            playsInline={playsInline}
            preload="metadata"
            onLoadedData={handleLoaded}
            onError={handleLoaded}
            className="relative w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
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

export { MDXVideo as Video }
