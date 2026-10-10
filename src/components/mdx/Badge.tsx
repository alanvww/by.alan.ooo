import type { ReactNode } from 'react'

export function Badge({ children, variant = 'default' }: { children: ReactNode, variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' }) {
  const variants: Record<string, string> = {
    default: 'border border-xmb-fg/20 bg-xmb-fg/15 text-xmb-fg/90',
    secondary: 'border border-xmb-fg/10 bg-xmb-fg/5 text-xmb-fg/75',
    outline: 'border border-xmb-fg/25 bg-transparent text-xmb-fg/75',
    success: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    warning: 'border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300',
    error: 'border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider ${variants[variant] ?? variants.default}`}>
      {children}
    </span>
  )
}



