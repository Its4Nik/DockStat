import type React from 'react'
import type { THEME } from '@dockstat/typings'
import { createContext, useContext } from 'react'

export interface ThemeContextType {
  // Current theme data
  theme: THEME.THEME_config | null
  themeName: string
  themeVars: Record<string, string>

  // Theme management
  setThemeName: (name: string) => void
  refreshTheme: () => Promise<void>

  // Loading states
  isLoading: boolean
  isThemeLoaded: boolean
  error: string | null

  // Available themes
  availableThemes: string[]
}

export const ThemeContext = createContext<ThemeContextType | null>(null)

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
