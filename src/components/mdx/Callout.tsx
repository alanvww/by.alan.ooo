import type { ReactNode } from 'react'

export function Callout({ children, type = 'info', title }: { children: ReactNode, type?: 'info' | 'warning' | 'success' | 'error' | 'note', title?: string }) {
  const typeStyles: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300',
    note: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
  }
  return (
    <div className={`p-4 border-l-4 rounded-r-lg my-6 flex ${typeStyles[type]}`}>
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-2">{title}</h4>}
        <div>{children}</div>
      </div>
    </div>
  )
}


