"use client"
import { useId, useState, type ReactNode } from 'react'

export function Demo({ children, title = 'Live Demo' }: { children: ReactNode, title?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const panelId = useId()
  return (
    <div className="my-10 rounded-xl border border-xmb-fg/10 bg-xmb-fg/5 shadow-2xl overflow-hidden backdrop-blur-sm">
      {children}
      <div className="border-t border-xmb-fg/10 bg-xmb-fg/5 px-4 py-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? panelId : undefined}
          className="flex items-center justify-between w-full text-xs font-mono uppercase tracking-widest text-xmb-fg/50 hover:text-xmb-fg transition-colors"
        >
          <span>{title}</span>
          <svg aria-hidden="true" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div id={panelId} className="mt-3 pt-3 border-t border-xmb-fg/10">
            <p className="text-xs font-mono text-xmb-fg/50">Interactive demo preview</p>
          </div>
        )}
      </div>
    </div>
  )
}



