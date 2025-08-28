import { useState, useCallback, useRef, useEffect } from 'react'
import type { THEME } from '@dockstat/typings'

interface UseThemeStateProps {
  initialTheme?: THEME.THEME_config
  initialThemeName?: string
}

export function useThemeState({
  initialTheme,
  initialThemeName = 'default-dark'
}: UseThemeStateProps) {
  const [theme, setTheme] = useState<THEME.THEME_config | null>(initialTheme ?? null)
  const [themeName, setThemeName] = useState<string>(initialTheme?.name ?? initialThemeName)
  const [themeVars, setThemeVars] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])

  // Track if we've initialized to prevent duplicate initial loads
  const hasInitialized = useRef(false)
  const currentThemeNameRef = useRef(themeName)

  useEffect(() => {
    currentThemeNameRef.current = themeName
  }, [themeName])

  const updateTheme = useCallback((newTheme: THEME.THEME_config, cssVars: Record<string, string>) => {
    setTheme(newTheme)
    setThemeName(newTheme.name)
    setThemeVars(cssVars)
    setError(null)
  }, [])

  const setThemeError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])

  const markInitialized = useCallback(() => {
    hasInitialized.current = true
  }, [])

  return {
    theme,
    themeName,
    themeVars,
    error,
    availableThemes,
    setAvailableThemes,
    updateTheme,
    setThemeError,
    hasInitialized: hasInitialized.current,
    markInitialized,
    currentThemeNameRef
  }
}
