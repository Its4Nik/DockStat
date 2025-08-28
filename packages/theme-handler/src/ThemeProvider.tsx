// theme-handler/src/ThemeProvider.tsx
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { THEME } from '@dockstat/typings'
import type ThemeHandler from '../index'
import { ThemeLoadingOverlay } from './ThemeLoadingOverlay'
import { ThemeContext } from './context'
import {
  type CSSVariableParserConfig,
  applyCSSVariables,
  defaultParserConfig,
  parseThemeVars,
  removeCSSVariables,
  parserConfigs,
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
  enableTailwindVariables?: boolean
  themeNamespace?: 'components' | 'background' | undefined

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
  enableTailwindVariables = false,
  themeNamespace,
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
  const [theme, setTheme] = useState<THEME.THEME_config | null>(initialTheme ?? null)
  const [themeName, setThemeNameState] = useState<string>(initialTheme?.name ?? initialThemeName)
  const [themeVars, setThemeVars] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isThemeLoaded, setIsThemeLoaded] = useState<boolean>(!!initialTheme)
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])

  // Refs for cleanup and tracking
  const currentCSSVars = useRef<Record<string, string>>({})
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Merge CSS parser configuration
  const finalCssParserConfig = useMemo(() => {
    let baseConfig: CSSVariableParserConfig = defaultParserConfig

    if (themeNamespace === 'components') {
      baseConfig = parserConfigs.componentsOnly as CSSVariableParserConfig
    } else {
      baseConfig = parserConfigs.standard as CSSVariableParserConfig
    }

    if (enableTailwindVariables) {
      baseConfig = {
        ...baseConfig,
        prefix: '',
        transformKey: (_key: string, path: string[]) => {
          if (path[0] === 'components') {
            return path.slice(1).join('-').toLowerCase()
          }
          return path.join('-').toLowerCase()
        },
      }
    }

    return { ...baseConfig, ...(cssParserConfig as CSSVariableParserConfig) }
  }, [cssParserConfig, enableTailwindVariables, themeNamespace])

  /**
   * Loads available themes list
   */
  const loadAvailableThemes = useCallback(async (): Promise<void> => {
    try {
      if (themeHandler) {
        const themeNames = themeHandler.getThemeNames()
        setAvailableThemes(themeNames)
        return
      }

      if (apiEndpoint) {
        const response = await fetch(`${apiEndpoint}/themes`, {
          headers: apiHeaders,
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const themes = await response.json()
        if (Array.isArray(themes)) {
          const names = themes.map((t: string | { name: string }) => (typeof t === 'string' ? t : t.name))
          setAvailableThemes(names)
        } else {
          setAvailableThemes([themeName])
        }
        return
      }

      setAvailableThemes([themeName])
    } catch (_err) {
      // fallback
      setAvailableThemes([themeName])
      // preserve error state silently
      // console.warn('Failed to load available themes:', err)
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
          loadedTheme = themeHandler.getTheme(name)
        } else if (apiEndpoint) {
          const base = apiEndpoint ? apiEndpoint.replace(/\/+$/, '') : ''
          const url = `${base}/themes/${encodeURIComponent(name)}`

          const response = await fetch(url, {
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
        // if aborted, return null (caller should detect)
        if (err instanceof Error && (err.name === 'AbortError' || err.message === 'AbortError')) {
          return null
        }

        if (attempt < retryAttempts) {
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current)
          }
          await new Promise<void>((resolve) => {
            retryTimeoutRef.current = setTimeout(() => resolve(), retryDelay)
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
    (themeConfig: THEME.THEME_config): Record<string, string> => {
      try {
        // Remove previous CSS variables
        if (Object.keys(currentCSSVars.current).length > 0) {
          removeCSSVariables(currentCSSVars.current)
        }

        // Parse theme variables to CSS variables
        let cssVars: Record<string, string> = {}

        if (themeNamespace === 'components') {
          cssVars = parseThemeVars({ components: themeConfig.vars.components } as THEME.THEME_vars, finalCssParserConfig)
        } else if (themeNamespace === 'background') {
          cssVars = parseThemeVars({ background_effect: themeConfig.vars.background_effect } as THEME.THEME_vars, finalCssParserConfig)
        } else {
          cssVars = parseThemeVars(themeConfig.vars, finalCssParserConfig)
        }

        // Apply new CSS variables (client-only)
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
    [finalCssParserConfig, themeNamespace]
  )

  /**
   * Sets a new theme by name
   */
  const setThemeName = useCallback(
    async (name: string) => {
      // If same theme already active and loaded, do nothing
      if (name === themeName && theme && isThemeLoaded) {
        return
      }

      setIsLoading(true)
      setError(null)
      setIsThemeLoaded(false)

      try {
        const loadedTheme = await loadTheme(name)

        if (!loadedTheme) {
          // aborted / cancelled
          return
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
          } catch (_err) {
            // non-fatal
            // console.warn('Failed to update active theme in database:', err)
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        setIsThemeLoaded(false)

        // Call error handler
        if (onThemeLoadError) {
          onThemeLoadError(err instanceof Error ? err : new Error(errorMessage), name)
        }

        // Try fallback theme if different from current
        if (name !== fallbackThemeName) {
          try {
            const fallbackTheme = await loadTheme(fallbackThemeName)
            if (fallbackTheme) {
              applyThemeVariables(fallbackTheme)
              setTheme(fallbackTheme)
              setThemeNameState(fallbackThemeName)
              setIsThemeLoaded(true)
              setError(null)
            }
          } catch (_fallbackErr) {
            // console.error('Failed to load fallback theme:', fallbackErr)
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
    let mounted = true

    const initializeTheme = async (): Promise<void> => {
      if (!mounted) return
      if (!initialTheme) {
        await loadAvailableThemes()
        await setThemeName(initialThemeName)
      } else {
        // Apply initial theme variables
        applyThemeVariables(initialTheme)
        setIsThemeLoaded(true)
        // Still load available themes for theme switching
        loadAvailableThemes().catch(() => {
          /* ignore */
        })
      }
    }

    initializeTheme()

    return () => {
      mounted = false
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // do not remove CSS variables on unmount (apps may want them persisted)
    }
  }, [
    initialTheme,
    initialThemeName,
    loadAvailableThemes,
    applyThemeVariables,
    setThemeName,
  ])

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
