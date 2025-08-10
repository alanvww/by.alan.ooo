import Image from 'next/image'

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
  return (
    <figure className="my-8">
      <div className="relative overflow-hidden rounded-lg border bg-muted/50">
        <Image
          src={src}
          alt={alt}
          width={width || 800}
          height={height || 450}
          className="w-full h-auto object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 65ch"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}


