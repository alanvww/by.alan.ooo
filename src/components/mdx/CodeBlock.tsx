"use client"
import { useEffect, useRef, useState } from 'react'

/**
 * Frame around highlighted code blocks. Syntax highlighting itself is done
 * server-side by rehype-pretty-code (shiki) — this component only adds the
 * chrome: language label, copy button, and the scroll container.
 */
export function CodeBlock({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement> & { 'data-language'?: string }) {
  const preRef = useRef<HTMLPreElement>(null)
  const copiedTimerRef = useRef<number | null>(null)
  const [copied, setCopied] = useState(false)
  const language = props['data-language']

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(preRef.current?.textContent ?? '')
      setCopied(true)
      // Re-arm rather than stack: a second copy inside the 2s window must
      // restart the "Copied!" confirmation, not get cut short by the first
      // timer (same pattern as XMBTouchButton's hold timers).
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = window.setTimeout(() => {
        copiedTimerRef.current = null
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <figure className="my-8 overflow-hidden rounded-xl border border-xmb-fg/10 bg-xmb-fg/5 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-xmb-fg/10 bg-xmb-fg/5">
        <span className="text-xs font-mono text-xmb-fg/50 uppercase tracking-wide">
          {language && language !== 'plaintext' ? language : ''}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-xs font-mono text-xmb-fg/50 hover:text-xmb-fg transition-colors"
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
      <pre
        ref={preRef}
        className={`overflow-x-auto p-4 text-sm leading-relaxed ${className ?? ''}`}
        {...props}
      >
        {children}
      </pre>
    </figure>
  )
}
