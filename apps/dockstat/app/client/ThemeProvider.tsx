import type React from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { THEME } from '@dockstat/typings'
import { ThemeContext, type ThemeContextType } from './ThemeContext'
import { applyCSSVariables, removeCSSVariables } from './cssVars'
import { type CSSVariableParserConfig, parseThemeVars, defaultParserConfig, parserConfigs } from './cssVariableParser'

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
  enableTailwindVariables = false,
  themeNamespace,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<THEME.THEME_config | null>(initialTheme ?? null)
  const [themeName, setThemeNameState] = useState<string>(initialTheme?.name ?? initialThemeName)
  const [themeVars, setThemeVars] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableThemes, setAvailableThemes] = useState<string[]>([])
  const currentCSSVars = useRef<Record<string, string>>({})

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

  const applyThemeVariables = useCallback(
    (themeConfig: THEME.THEME_config): void => {
      if (Object.keys(currentCSSVars.current).length > 0) {
        removeCSSVariables(currentCSSVars.current)
      }
      let cssVars: Record<string, string> = {}
      if (themeNamespace === 'components') {
        cssVars = parseThemeVars({ components: themeConfig.vars.components } as THEME.THEME_vars, finalCssParserConfig)
      } else if (themeNamespace === 'background') {
        cssVars = parseThemeVars({ background_effect: themeConfig.vars.background_effect } as THEME.THEME_vars, finalCssParserConfig)
      } else {
        cssVars = parseThemeVars(themeConfig.vars, finalCssParserConfig)
      }
      applyCSSVariables(cssVars)
      currentCSSVars.current = cssVars
      setThemeVars(cssVars)
    },
    [finalCssParserConfig, themeNamespace]
  )

  const loadAvailableThemes = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(apiEndpoint, { headers: apiHeaders })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()

      // Handle the response structure { themes: string[] }
      const themes = data.themes || data

      if (Array.isArray(themes)) {
        setAvailableThemes(themes)
      } else {
        console.warn('Unexpected themes response format:', data)
        setAvailableThemes([initialThemeName])
      }
    } catch (err) {
      console.error('Failed to load available themes:', err)
      setAvailableThemes([initialThemeName])
    }
  }, [apiEndpoint, apiHeaders, initialThemeName])

  const loadTheme = useCallback(
    async (name: string): Promise<THEME.THEME_config | null> => {
      const url = `${apiEndpoint}/${encodeURIComponent(name)}`
      try {
        const response = await fetch(url, { headers: apiHeaders })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        const themeData = await response.json()
        return themeData
      } catch (err) {
        console.error(`Failed to load theme ${name}:`, err)
        throw err
      }
    },
    [apiEndpoint, apiHeaders]
  )

  const setThemeName = useCallback(
    async (name: string) => {
      if (name === themeName && theme && theme.name === name) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loadedTheme = await loadTheme(name)
        if (!loadedTheme) {
          throw new Error(`Theme ${name} returned empty`)
        }

        applyThemeVariables(loadedTheme)
        setTheme(loadedTheme)
        setThemeNameState(name)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        console.error(`Failed to load theme ${name}:`, errorMessage)

        // Try fallback theme if different from the one that failed
        if (name !== fallbackThemeName) {
          try {
            const fallbackTheme = await loadTheme(fallbackThemeName)
            if (fallbackTheme) {
              applyThemeVariables(fallbackTheme)
              setTheme(fallbackTheme)
              setThemeNameState(fallbackThemeName)
            }
          } catch (fallbackErr) {
            console.error('Failed to load fallback theme:', fallbackErr)
          }
        }
      } finally {
        setIsLoading(false)
      }
    },
    [themeName, theme, loadTheme, applyThemeVariables, fallbackThemeName]
  )

  // Apply initial theme CSS variables
  useEffect(() => {
    if (initialTheme?.vars) {
      applyThemeVariables(initialTheme)
    }
  }, [initialTheme, applyThemeVariables])

  // Load available themes on mount
  useEffect(() => {
    loadAvailableThemes()
  }, [loadAvailableThemes])

  const contextValue: ThemeContextType = {
    theme,
    themeName,
    themeVars,
    setThemeName,
    refreshTheme: async () => {
      if (themeName) {
        await setThemeName(themeName)
      }
    },
    isLoading,
    isThemeLoaded: !!theme,
    error,
    availableThemes,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
