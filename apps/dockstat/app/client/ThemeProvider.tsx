import type React from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { THEME } from '@dockstat/typings'
import { ThemeContext, type ThemeContextType } from './ThemeContext'
import { useThemeLoader } from './hooks/useThemeLoader'
import { useThemeCSS } from './hooks/useThemeCSS'
import { useThemeState } from './hooks/useThemeState'
import type { CSSVariableParserConfig } from './cssVariableParser'

export interface ThemeProviderProps {
  children: React.ReactNode
  initialThemeName?: string
  initialTheme?: THEME.THEME_config
  fallbackThemeName?: string
  apiEndpoint?: string
  apiHeaders?: Record<string, string>
  cssParserConfig?: Partial<CSSVariableParserConfig>
  enableTailwindVariables?: boolean
  themeNamespace?: 'components' | 'background' | undefined
}

function ThemeProvider({
  children,
  initialThemeName = 'default-dark',
  initialTheme,
  fallbackThemeName = 'default-dark',
  apiEndpoint = '/api/themes',
  apiHeaders = {},
  cssParserConfig = {},
  enableTailwindVariables = true,
  themeNamespace,
}: ThemeProviderProps) {
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)

  // Initialize hooks
  const {
    theme,
    themeName,
    themeVars,
    error,
    availableThemes,
    setAvailableThemes,
    updateTheme,
    setThemeError,
    hasInitialized,
    markInitialized,
    currentThemeNameRef
  } = useThemeState({ initialTheme, initialThemeName })

  const { loadTheme, loadAvailableThemes, clearCache } = useThemeLoader({
    apiEndpoint,
    apiHeaders
  })

  const { applyThemeVariables, cleanup } = useThemeCSS({
    cssParserConfig,
    enableTailwindVariables,
    themeNamespace
  })

  // Cleanup on unmount
  useEffect(() => {
    console.debug('[ThemeProvider] Mounting ThemeProvider')
    mountedRef.current = true
    return () => {
      console.debug('[ThemeProvider] Unmounting ThemeProvider, cleaning up')
      mountedRef.current = false
      cleanup()
      clearCache()
    }
  }, [cleanup, clearCache])

  // Function to change theme
  const setThemeByName = useCallback(
    async (name: string) => {
      console.debug('[ThemeProvider] Request to set theme:', name)

      // Prevent duplicate loads
      if (loadingRef.current) {
        console.debug('[ThemeProvider] Theme load already in progress, skipping')
        return
      }
      if (theme && theme.name === name) {
        console.debug('[ThemeProvider] Theme already active:', name)
        return
      }

      loadingRef.current = true
      setThemeError('')

      try {
        console.debug('[ThemeProvider] Loading theme:', name)
        const loadedTheme = await loadTheme(name)

        if (!loadedTheme) {
          throw new Error(`Theme ${name} returned empty`)
        }

        if (mountedRef.current) {
          console.debug('[ThemeProvider] Applying theme:', name)
          const cssVars = applyThemeVariables(loadedTheme)
          updateTheme(loadedTheme, cssVars)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

        if (mountedRef.current) {
          setThemeError(errorMessage)
          console.error(`[ThemeProvider] Failed to load theme ${name}:`, errorMessage)

          // Try fallback theme only if we don't have any theme loaded
          if (!theme && name !== fallbackThemeName) {
            console.debug('[ThemeProvider] Attempting fallback theme:', fallbackThemeName)
            try {
              const fallbackTheme = await loadTheme(fallbackThemeName)
              if (fallbackTheme && mountedRef.current) {
                console.debug('[ThemeProvider] Applying fallback theme:', fallbackThemeName)
                const cssVars = applyThemeVariables(fallbackTheme)
                updateTheme(fallbackTheme, cssVars)
              }
            } catch (fallbackErr) {
              console.error('[ThemeProvider] Failed to load fallback theme:', fallbackErr)
            }
          }
        }
      } finally {
        loadingRef.current = false
        console.debug('[ThemeProvider] Finished theme load for:', name)
      }
    },
    [theme, loadTheme, applyThemeVariables, updateTheme, setThemeError, fallbackThemeName]
  )

  // Initialize theme on mount
  useLayoutEffect(() => {
    if (hasInitialized) {
      console.debug('[ThemeProvider] Already initialized, skipping')
      return
    }

    console.debug('[ThemeProvider] Initializing theme')
    markInitialized()

    if (initialTheme) {
      console.debug('[ThemeProvider] Using provided initialTheme object')
      const cssVars = applyThemeVariables(initialTheme)
      updateTheme(initialTheme, cssVars)
    } else {
      console.debug('[ThemeProvider] Loading initial theme by name:', initialThemeName)
      setThemeByName(initialThemeName)
    }
  }, []) // Intentionally empty - only run once

  // Load available themes list
  useEffect(() => {
    let cancelled = false
    console.debug('[ThemeProvider] Loading available themes list')

    const loadThemes = async () => {
      const themes = await loadAvailableThemes()
      if (!cancelled && mountedRef.current) {
        console.debug('[ThemeProvider] Available themes loaded:', themes)
        setAvailableThemes(themes.length > 0 ? themes : [fallbackThemeName])
      }
    }

    loadThemes()

    return () => {
      cancelled = true
      console.debug('[ThemeProvider] Cancelled available themes loading')
    }
  }, []) // Intentionally empty - only run once

  // Refresh theme function
  const refreshTheme = useCallback(async () => {
    console.debug('[ThemeProvider] Refreshing current theme:', currentThemeNameRef.current)
    if (currentThemeNameRef.current && !loadingRef.current) {
      clearCache()
      await setThemeByName(currentThemeNameRef.current)
    }
  }, [setThemeByName, clearCache, currentThemeNameRef.current])

  // Context value
  const contextValue: ThemeContextType = useMemo(() => {
    console.debug('[ThemeProvider] Building context value', {
      themeName,
      isLoading: loadingRef.current,
      isThemeLoaded: !!theme,
      error,
      availableThemes
    })

    return {
      theme,
      themeName,
      themeVars,
      setThemeName: setThemeByName,
      refreshTheme,
      isLoading: loadingRef.current,
      isThemeLoaded: !!theme,
      error,
      availableThemes,
    }
  }, [theme, themeName, themeVars, setThemeByName, refreshTheme, error, availableThemes])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
