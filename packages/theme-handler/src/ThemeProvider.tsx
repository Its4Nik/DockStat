import type { THEME } from '@dockstat/typings'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { default as ThemeHandler } from '../index'
import { ThemeLoadingOverlay } from './ThemeLoadingOverlay'
import { ThemeContext } from './context'
import {
  type CSSVariableParserConfig,
  applyCSSVariables,
  defaultParserConfig,
  parseThemeVars,
  removeCSSVariables,
} from './cssVariableParser'

export interface ThemeProviderProps {
  children: React.ReactNode

  // Theme configuration
  initialThemeName?: string
  initialTheme?: THEME.THEME_config
  fallbackThemeName?: string

  // Theme handler instance
  themeHandler?: ThemeHandler

  // API configuration for remote theme loading
  apiEndpoint?: string
  apiHeaders?: Record<string, string>

  // CSS variable parsing configuration
  cssParserConfig?: Partial<CSSVariableParserConfig>

  // Loading and error handling
  showLoadingOverlay?: boolean
  customLoadingContent?: React.ReactNode
  customErrorContent?: React.ReactNode

  // Event handlers
  onThemeChange?: (themeName: string, theme: THEME.THEME_config | null) => void
  onThemeLoadError?: (error: Error, themeName: string) => void
  onThemeLoaded?: (themeName: string, theme: THEME.THEME_config) => void

  // Auto-retry configuration
  retryAttempts?: number
  retryDelay?: number
}

export function ThemeProvider({
  children,
  initialThemeName = 'default',
  initialTheme,
  fallbackThemeName = 'default',
  themeHandler,
  apiEndpoint,
  apiHeaders = {},
  cssParserConfig = {},
  showLoadingOverlay = true,
  customLoadingContent,
  customErrorContent,
  onThemeChange,
  onThemeLoadError,
  onThemeLoaded,
  retryAttempts = 3,
  retryDelay = 1000,
}: ThemeProviderProps) {
  // State management
  const [theme, setTheme] = useState<THEME.THEME_config | null>(
    initialTheme || null
  )
  const [themeName, setThemeNameState] = useState(initialThemeName)
  const [themeVars, setThemeVars] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isThemeLoaded, setIsThemeLoaded] = useState(!!initialTheme)
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])

  // Refs for cleanup and tracking
  const currentCSSVars = useRef<Record<string, string>>({})
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | undefined>(undefined)

  // Merge CSS parser configuration
  const finalCssParserConfig = useMemo(
    () => ({ ...defaultParserConfig, ...cssParserConfig }),
    [cssParserConfig]
  )

  /**
   * Loads available themes list
   */
  const loadAvailableThemes = useCallback(async () => {
    try {
      if (themeHandler) {
        // Load from database via theme handler
        const themeNames = themeHandler.getThemeNames()
        setAvailableThemes(themeNames)
      } else if (apiEndpoint) {
        // Load from API
        const response = await fetch(`${apiEndpoint}/themes`, {
          headers: apiHeaders,
        })
        if (response.ok) {
          const themes = await response.json()
          setAvailableThemes(
            Array.isArray(themes)
              ? themes.map((t: string | { name: string }) =>
                  typeof t === 'string' ? t : t.name
                )
              : []
          )
        }
      } else {
        // Set default theme as available if no handler or API
        setAvailableThemes([themeName])
      }
    } catch (err) {
      console.warn('Failed to load available themes:', err)
      // Fallback to current theme
      setAvailableThemes([themeName])
    }
  }, [themeHandler, apiEndpoint, apiHeaders, themeName])

  /**
   * Loads a theme with retry logic
   */
  const loadTheme = useCallback(
    async (name: string, attempt = 0): Promise<THEME.THEME_config | null> => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        let loadedTheme: THEME.THEME_config | null = null

        if (themeHandler) {
          // Load from database via theme handler
          loadedTheme = themeHandler.getTheme(name)
        } else if (apiEndpoint) {
          // Load from API
          const response = await fetch(`${apiEndpoint}/themes/${name}`, {
            headers: apiHeaders,
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          loadedTheme = await response.json()
        } else {
          throw new Error('No theme handler or API endpoint provided')
        }

        if (!loadedTheme) {
          throw new Error(`Theme '${name}' not found`)
        }

        return loadedTheme
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return null // Request was cancelled
        }

        if (attempt < retryAttempts) {
          console.warn(
            `Theme load attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`
          )
          await new Promise((resolve) => {
            retryTimeoutRef.current = setTimeout(resolve, retryDelay)
          })
          return loadTheme(name, attempt + 1)
        }

        throw err
      }
    },
    [themeHandler, apiEndpoint, apiHeaders, retryAttempts, retryDelay]
  )

  /**
   * Applies theme CSS variables to the document
   */
  const applyThemeVariables = useCallback(
    (themeConfig: THEME.THEME_config) => {
      try {
        // Remove previous CSS variables
        if (Object.keys(currentCSSVars.current).length > 0) {
          removeCSSVariables(currentCSSVars.current)
        }

        // Parse theme variables to CSS variables
        const cssVars = parseThemeVars(themeConfig.vars, finalCssParserConfig)

        // Apply new CSS variables
        applyCSSVariables(cssVars)

        // Store current variables for cleanup
        currentCSSVars.current = cssVars
        setThemeVars(cssVars)

        return cssVars
      } catch (err) {
        console.error('Failed to apply theme variables:', err)
        throw new Error('Failed to parse theme variables')
      }
    },
    [finalCssParserConfig]
  )

  /**
   * Sets a new theme by name
   */
  const setThemeName = useCallback(
    async (name: string) => {
      if (name === themeName && theme && isThemeLoaded) {
        return // Theme is already loaded
      }

      setIsLoading(true)
      setError(null)
      setIsThemeLoaded(false)

      try {
        const loadedTheme = await loadTheme(name)

        if (!loadedTheme) {
          return // Request was cancelled
        }

        // Apply theme variables
        applyThemeVariables(loadedTheme)

        // Update state
        setTheme(loadedTheme)
        setThemeNameState(name)
        setIsThemeLoaded(true)
        setError(null)

        // Call event handlers
        onThemeChange?.(name, loadedTheme)
        onThemeLoaded?.(name, loadedTheme)

        // Update active theme in database if using theme handler
        if (themeHandler) {
          try {
            themeHandler.setActiveTheme(name)
          } catch (err) {
            console.warn('Failed to update active theme in database:', err)
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        setIsThemeLoaded(false)

        // Call error handler
        if (onThemeLoadError) {
          onThemeLoadError(
            err instanceof Error ? err : new Error(errorMessage),
            name
          )
        }

        // Try fallback theme if different from current
        if (name !== fallbackThemeName) {
          console.warn(
            `Failed to load theme '${name}', trying fallback '${fallbackThemeName}'`
          )
          try {
            const fallbackTheme = await loadTheme(fallbackThemeName)
            if (fallbackTheme) {
              applyThemeVariables(fallbackTheme)
              setTheme(fallbackTheme)
              setThemeNameState(fallbackThemeName)
              setIsThemeLoaded(true)
              setError(null)
            }
          } catch (fallbackErr) {
            console.error('Failed to load fallback theme:', fallbackErr)
          }
        }
      } finally {
        setIsLoading(false)
      }
    },
    [
      themeName,
      theme,
      isThemeLoaded,
      loadTheme,
      applyThemeVariables,
      onThemeChange,
      onThemeLoaded,
      onThemeLoadError,
      themeHandler,
      fallbackThemeName,
    ]
  )

  /**
   * Refreshes the current theme
   */
  const refreshTheme = useCallback(async () => {
    await setThemeName(themeName)
  }, [setThemeName, themeName])

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = async () => {
      if (!initialTheme) {
        // Load available themes first
        await loadAvailableThemes()
        // Then load the initial theme
        await setThemeName(initialThemeName)
      } else {
        // Apply initial theme variables
        applyThemeVariables(initialTheme)
        setIsThemeLoaded(true)
        // Still load available themes for theme switching
        loadAvailableThemes()
      }
    }

    initializeTheme()

    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Note: We don't remove CSS variables on unmount as they might be used by other components
    }
  }, [
    initialTheme,
    initialThemeName,
    loadAvailableThemes,
    applyThemeVariables,
    setThemeName,
  ])

  // Context value
  const contextValue = {
    theme,
    themeName,
    themeVars,
    setThemeName,
    refreshTheme,
    isLoading,
    isThemeLoaded,
    error,
    availableThemes,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {showLoadingOverlay && (
        <ThemeLoadingOverlay
          isThemeLoaded={isThemeLoaded}
          isLoading={isLoading}
          error={error}
          customLoadingContent={customLoadingContent}
          customErrorContent={customErrorContent}
        />
      )}
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
