"use client"
import { isValidElement, useState, type ReactNode } from 'react'

export function Tabs({ children, defaultTab = 0 }: { children: ReactNode, defaultTab?: number }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const childArray = Array.isArray(children) ? (children as ReactNode[]) : null
  const tabLabels = childArray
    ? childArray.map((child) =>
        isValidElement(child) ? (child.props as { label?: string }).label || 'Tab' : 'Tab'
      )
    : ['Tab']
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
        {childArray ? childArray[activeTab] : children}
      </div>
    </div>
  )
}

export function Tab({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}


