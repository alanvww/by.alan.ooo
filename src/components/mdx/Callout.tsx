import type { ReactNode } from 'react'

export function Callout({ children, type = 'info', title }: { children: ReactNode, type?: 'info' | 'warning' | 'success' | 'error' | 'note', title?: string }) {
  const typeStyles: Record<string, string> = {
    info: 'border-l-sky-400/60 bg-sky-500/5 text-xmb-fg/80',
    warning: 'border-l-amber-400/60 bg-amber-500/5 text-xmb-fg/80',
    success: 'border-l-emerald-400/60 bg-emerald-500/5 text-xmb-fg/80',
    error: 'border-l-rose-400/60 bg-rose-500/5 text-xmb-fg/80',
    note: 'border-l-xmb-fg/40 bg-xmb-fg/5 text-xmb-fg/80',
  }
  return (
    <div className={`p-5 border border-xmb-fg/10 border-l-4 rounded-r-xl my-8 flex backdrop-blur-sm ${typeStyles[type] ?? typeStyles.info}`}>
      <div className="flex-1 [&>p:last-child]:mb-0">
        {title && <h4 className="text-sm font-mono uppercase tracking-widest text-xmb-fg/90 mb-2">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  )
}


