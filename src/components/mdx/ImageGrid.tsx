import type { ReactNode } from 'react'

export interface ImageGridProps {
  children: ReactNode
  /** Number of columns on desktop (2 or 3). Defaults to 2. */
  cols?: 2 | 3
  /** Optional shared caption below the grid. */
  caption?: string
}

/**
 * Responsive multi-column grid for grouping markdown images, <Figure>, or
 * <Video> blocks side by side without stacked vertical margins.
 */
export function ImageGrid({ children, cols = 2, caption }: ImageGridProps) {
  const gridCols = cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'

  return (
    <div className="my-10">
      <div
        className={`grid grid-cols-1 ${gridCols} gap-6 items-start [&_figure]:my-0 [&>p]:contents [&>div]:contents`}
      >
        {children}
      </div>
      {caption && (
        <p className="mt-3 text-center text-xs font-mono text-xmb-fg/50 tracking-widest uppercase">
          {caption}
        </p>
      )}
    </div>
  )
}
