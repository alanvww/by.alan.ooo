import type { ReactNode } from 'react'

export function Card({ children, className = '', title }: { children: ReactNode, className?: string, title?: string }) {
  return (
    <div className={`my-6 rounded-xl border border-xmb-fg/10 bg-xmb-fg/5 p-6 backdrop-blur-sm shadow-2xl ${className}`}>
      {title && (
        <h3 className="text-lg font-light tracking-tight mb-4 text-xmb-fg/90">{title}</h3>
      )}
      {children}
    </div>
  )
}



