import { MDXImage } from './MDXImage'
import { getLocalImageDimensions } from '@/lib/content-assets'

/**
 * Authored-MDX figure. Same rendering path as plain markdown images
 * (dot-wave placeholder, intrinsic sizing, XMB chrome) with an explicit
 * caption prop. Dimensions are probed server-side when not provided.
 */
export function Figure({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
}) {
  const probed = !width || !height
    ? (src.startsWith('/') ? getLocalImageDimensions(src) : null)
    : null

  return (
    <MDXImage
      src={src}
      alt={alt}
      caption={caption}
      width={width ?? probed?.width}
      height={height ?? probed?.height}
    />
  )
}
