import type { ReactNode } from 'react'

export function Card({ children, className = '', title }: { children: ReactNode, className?: string, title?: string }) {
  return (
    <div className={`my-6 rounded-lg border bg-card p-6 shadow-sm ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      {children}
    </div>
  )
}


