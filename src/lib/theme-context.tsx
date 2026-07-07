'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function applyDocumentTheme(theme: Theme): void {
  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(theme)
  document.documentElement.setAttribute('data-theme', theme)
}

/**
 * Theme follows the OS preference — nothing is persisted, so the site always
 * matches the visitor's current system setting (including live changes like
 * sunset auto-switching). The pre-hydration class is set by ThemeScript.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = (matchesDark: boolean): void => {
      const nextTheme: Theme = matchesDark ? 'dark' : 'light'
      setTheme(nextTheme)
      applyDocumentTheme(nextTheme)
    }

    apply(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent): void => apply(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
