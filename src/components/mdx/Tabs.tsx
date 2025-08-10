"use client"
import { useState, type ReactNode } from 'react'

export function Tabs({ children, defaultTab = 0 }: { children: ReactNode, defaultTab?: number }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const tabLabels = Array.isArray(children) ? (children as any[]).map((child: any) => child.props?.label || 'Tab') : ['Tab']
  return (
    <div className="my-6">
      <div className="flex border-b border-border">
        {tabLabels.map((label, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === index ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {Array.isArray(children) ? (children as any[])[activeTab] : children}
      </div>
    </div>
  )
}

export function Tab({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}


