import type { ReactNode } from 'react'

export function Alert({ children, variant = 'default', title }: { children: ReactNode, variant?: 'default' | 'destructive' | 'success', title?: string }) {
  return (
    <div className={`my-6 rounded-lg border p-4 ${
      variant === 'destructive'
        ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300'
        : variant === 'success'
        ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
        : 'border-border bg-muted/50 text-foreground'
    }`}>
      {title && (
        <h4 className="font-semibold mb-2">{title}</h4>
      )}
      <div>{children}</div>
    </div>
  )
}


