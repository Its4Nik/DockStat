import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import { useCallback, useEffect, useRef, useState } from "react"
import { type ThemeListItem, ThemeProviderContext, type ThemeProviderData } from "@/contexts/theme"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { api } from "@/lib/api"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themesList, setThemesList] = useState<ThemeListItem[] | null>(null)
  const [theme, setTheme] = useState<ThemeContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Refs to store parameters used by the top-level Eden queries
  const requestedThemeNameRef = useRef<string | null>(null)
  const requestedThemeIdRef = useRef<number | null>(null)
  const hasLoadedSavedTheme = useRef(false)

  const themeByNameQuery = useEdenQuery({
    queryKey: ["themes", "by-name"],
    route: () =>
      api.themes["by-name"]({
        name: requestedThemeNameRef.current ?? "",
      }).get(),
    enabled: false,
  })

  const themeByIdQuery = useEdenQuery({
    queryKey: ["themes", "by-id"],
    route: () =>
      api.themes["by-id"]({
        id: requestedThemeIdRef.current ?? 0,
      }).get(),
    enabled: false,
  })

  const allThemesQuery = useEdenQuery({
    queryKey: ["themes", "all"],
    route: () => api.themes.get(),
    enabled: false,
  })

  const applyTheme = useCallback(
    async (themeName: string) => {
      setIsLoading(true)
      setError(null)

      try {
        requestedThemeNameRef.current = themeName
        const result = await themeByNameQuery.refetch()

        if (result.error || !result.data) {
          throw new Error(`Failed to fetch theme "${themeName}"`)
        }

        const responseData = result.data
        if (!responseData.success || !responseData.data) {
          throw new Error(responseData.message || `Theme "${themeName}" not found`)
        }

        const themeData: ThemeContextData = {
          id: responseData.data.id,
          vars: responseData.data.variables ?? {},
        }

        applyThemeToDocument(themeData)
        setTheme(themeData)
        saveThemePreference(themeData.id)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
      } finally {
        setIsLoading(false)
      }
    },
    [themeByNameQuery]
  )

  /**
   * Fetch and apply a theme by ID using the Eden Treaty client.
   * Uses the top-level `themeByIdQuery` and triggers it with `refetch()`.
   */
  const applyThemeById = useCallback(
    async (themeId: number) => {
      setIsLoading(true)
      setError(null)

      try {
        requestedThemeIdRef.current = themeId
        const result = await themeByIdQuery.refetch()

        if (result.error || !result.data) {
          throw new Error(`Failed to fetch theme with id ${themeId}`)
        }

        const responseData = result.data
        if (!responseData.success || !responseData.data) {
          throw new Error(responseData.message || `Theme with id ${themeId} not found`)
        }

        const themeData: ThemeContextData = {
          id: responseData.data.id,
          vars: responseData.data.variables ?? {},
        }

        applyThemeToDocument(themeData)
        setTheme(themeData)
        saveThemePreference(themeData.id)
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        setError(errorObj)
      } finally {
        setIsLoading(false)
      }
    },
    [themeByIdQuery]
  )

  /**
   * Fetch all themes using the top-level `allThemesQuery`.
   */
  const getAllThemes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await allThemesQuery.refetch()

      if (result.error || !result.data) {
        throw new Error(`Failed to fetch themes`)
      }

      const responseData = result.data
      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.message || `Failed to fetch themes`)
      }

      const themesData: ThemeListItem[] = responseData.data.map((t) => ({
        id: t.id,
        name: t.name,
        variables: t.variables ?? {},
      }))

      setThemesList(themesData)
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setError(errorObj)
    } finally {
      setIsLoading(false)
    }
  }, [allThemesQuery])

  useEffect(() => {
    if (theme?.id !== loadThemePreference()) {
      console.log("Theme preference changed")
    } else if (hasLoadedSavedTheme.current === true) {
      console.log("Theme already loaded")
      return
    }

    hasLoadedSavedTheme.current = true

    const savedThemeId = loadThemePreference()
    if (savedThemeId !== null) {
      applyThemeById(savedThemeId)
    }
  }, [applyThemeById, theme?.id])

  const providerValue: ThemeProviderData = {
    theme,
    isLoading,
    error,
    applyTheme,
    applyThemeById,
    themesList,
    getAllThemes,
  }

  return <ThemeProviderContext value={providerValue}>{children}</ThemeProviderContext>
}
