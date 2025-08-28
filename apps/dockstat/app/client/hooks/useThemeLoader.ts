import { useCallback, useRef } from 'react'
import type { THEME } from '@dockstat/typings'

interface UseThemeLoaderProps {
  apiEndpoint: string
  apiHeaders: Record<string, string>
}

export function useThemeLoader({ apiEndpoint, apiHeaders }: UseThemeLoaderProps) {
  const loadingPromiseRef = useRef<Promise<THEME.THEME_config | null> | null>(null)
  const themeCache = useRef<Map<string, THEME.THEME_config>>(new Map())

  const loadTheme = useCallback(
    async (name: string): Promise<THEME.THEME_config | null> => {
      // Check cache first
      if (themeCache.current.has(name)) {
        return themeCache.current.get(name) as THEME.THEME_config
      }

      // Return existing promise if already loading this theme
      if (loadingPromiseRef.current) {
        return loadingPromiseRef.current
      }

      const promise = (async () => {
        try {
          const url = `${apiEndpoint}/${encodeURIComponent(name)}`
          const response = await fetch(url, { headers: apiHeaders })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const themeData = await response.json() as THEME.THEME_config

          // Cache the theme
          themeCache.current.set(name, themeData)

          return themeData
        } catch (err) {
          console.error(`Failed to load theme ${name}:`, err)
          throw err
        } finally {
          loadingPromiseRef.current = null
        }
      })()

      loadingPromiseRef.current = promise
      return promise
    },
    [apiEndpoint, apiHeaders]
  )

  const loadAvailableThemes = useCallback(
    async (): Promise<string[]> => {
      try {
        const response = await fetch(apiEndpoint, { headers: apiHeaders })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        return data;
      } catch (err) {
        console.error('Failed to load available themes:', err)
        return []
      }
    },
    [apiEndpoint, apiHeaders]
  )

  const clearCache = useCallback(() => {
    themeCache.current.clear()
  }, [])

  return {
    loadTheme,
    loadAvailableThemes,
    clearCache,
    isLoading: loadingPromiseRef.current !== null
  }
}
