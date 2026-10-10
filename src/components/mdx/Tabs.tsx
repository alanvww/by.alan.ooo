"use client"
import { Children, isValidElement, useId, useState, type ReactNode } from 'react'

export function Tabs({ children, defaultTab = 0 }: { children: ReactNode; defaultTab?: number }) {
  const baseId = useId()
  const tabs = Children.toArray(children).filter((child) =>
    isValidElement<{ label?: string; children?: ReactNode }>(child),
  )
  const [activeTab, setActiveTab] = useState(() =>
    tabs.length > 0 ? Math.min(Math.max(defaultTab, 0), tabs.length - 1) : 0,
  )
  const clampedActive = tabs.length > 0 ? Math.min(activeTab, tabs.length - 1) : 0

  if (tabs.length === 0) {
    return <div className="my-8 p-4">{children}</div>
  }

  return (
    <div className="my-8 rounded-xl border border-xmb-fg/10 bg-xmb-fg/5 overflow-hidden backdrop-blur-sm">
      <div role="tablist" className="flex border-b border-xmb-fg/10 bg-xmb-fg/5 overflow-x-auto">
        {tabs.map((tab, index) => {
          const label = tab.props.label || `Tab ${index + 1}`
          const isSelected = clampedActive === index
          return (
            <button
              key={index}
              id={`${baseId}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${index}`}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${
                isSelected
                  ? 'border-b-2 border-xmb-fg text-xmb-fg bg-xmb-fg/5'
                  : 'text-xmb-fg/50 hover:text-xmb-fg/80'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div
        id={`${baseId}-panel-${clampedActive}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${clampedActive}`}
        className="p-5 [&>p:last-child]:mb-0"
      >
        {tabs[clampedActive]}
      </div>
    </div>
  )
}

export function Tab({ children }: { label?: string; children: ReactNode }) {
  return <div>{children}</div>
}



