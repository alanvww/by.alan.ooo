import type { ReactNode } from 'react'

export function Alert({ children, variant = 'default', title }: { children: ReactNode, variant?: 'default' | 'destructive' | 'success', title?: string }) {
  return (
    <div className={`my-8 rounded-xl border p-5 backdrop-blur-sm [&>p:last-child]:mb-0 ${
      variant === 'destructive'
        ? 'border-rose-500/30 bg-rose-500/10 text-xmb-fg/90'
        : variant === 'success'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-xmb-fg/90'
        : 'border-xmb-fg/15 bg-xmb-fg/5 text-xmb-fg/80'
    }`}>
      {title && (
        <h4 className="text-sm font-mono uppercase tracking-widest text-xmb-fg/90 mb-2">{title}</h4>
      )}
      <div>{children}</div>
    </div>
  )
}



