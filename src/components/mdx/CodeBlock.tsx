"use client"
import { useState, type HTMLAttributes } from 'react'

export function CodeBlock({ children, className, ...props }: { children: string } & Omit<HTMLAttributes<HTMLElement>, 'children'>) {
  const language = className ? className.replace('language-', '') : ''
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className="relative my-6 overflow-hidden rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between bg-muted/80 px-4 py-2 border-b">
        {language && (
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
            {language}
          </span>
        )}
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className={`${className} overflow-x-auto p-4 text-sm`} {...props}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}


