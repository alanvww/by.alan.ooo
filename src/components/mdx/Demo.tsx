"use client"
import { useId, useState, type ReactNode } from 'react'

export function Demo({ children, title = 'Live Demo' }: { children: ReactNode, title?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const panelId = useId()
  return (
    <div className="my-8 rounded-lg border bg-card shadow-lg overflow-hidden">
      {children}
      <div className="border-t bg-muted/50 p-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? panelId : undefined}
          className="flex items-center justify-between w-full text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
        >
          <span>{title}</span>
          <svg aria-hidden="true" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div id={panelId} className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">This is an interactive demo. Try interacting with the elements above.</p>
          </div>
        )}
      </div>
    </div>
  )
}


