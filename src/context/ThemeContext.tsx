import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = globalThis.localStorage?.getItem('theme')
      return (saved as Theme) || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    const root = globalThis.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    try {
      globalThis.localStorage?.setItem('theme', theme)
    } catch {
      // Ignore storage failures (e.g. incognito restrictions)
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
