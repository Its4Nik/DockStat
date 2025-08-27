import type { THEME } from '@dockstat/typings'
import { useCallback, useEffect, useState } from 'react'
import { ThemeContext } from './context'

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: THEME.THEME_config
  onThemeChange?: (themeName: string) => Promise<THEME.THEME_config>
  onThemeList?: () => Promise<string[]>
}

export function ThemeProvider({
  children,
  initialTheme,
  onThemeChange,
  onThemeList,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<THEME.THEME_config | null>(
    initialTheme ?? null
  )
  const [themeName, setThemeName] = useState<string>(
    initialTheme?.name ?? 'default'
  )
  const [themeVars, setThemeVars] = useState<Record<string, string>>(
    initialTheme?.vars ?? {}
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isThemeLoaded, setIsThemeLoaded] = useState(!!initialTheme)
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])

  const refreshTheme = useCallback(async () => {
    if (!onThemeChange) return

    setIsLoading(true)
    setError(null)

    try {
      const newTheme = await onThemeChange(themeName)
      setTheme(newTheme)
      setThemeVars(newTheme.vars)
      setIsThemeLoaded(true)

      // Apply theme variables to document root
      Object.entries(newTheme.vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme')
    } finally {
      setIsLoading(false)
    }
  }, [themeName, onThemeChange])

  const handleSetThemeName = useCallback((name: string) => {
    setThemeName(name)
  }, [])

  // Load available themes on mount
  useEffect(() => {
    if (!onThemeList) return

    const loadThemes = async () => {
      try {
        const themes = await onThemeList()
        setAvailableThemes(themes)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load theme list'
        )
      }
    }

    loadThemes()
  }, [onThemeList])

  // Refresh theme when theme name changes
  useEffect(() => {
    console.log('Theme name changed:', themeName)
    refreshTheme()
  }, [themeName, refreshTheme])

  // Apply initial theme variables
  useEffect(() => {
    if (initialTheme) {
      Object.entries(initialTheme.vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value)
      })
    }
  }, [initialTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName,
        themeVars,
        setThemeName: handleSetThemeName,
        refreshTheme,
        isLoading,
        isThemeLoaded,
        error,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
