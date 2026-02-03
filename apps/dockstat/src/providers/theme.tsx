import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import { useCallback, useEffect, useRef, useState } from "react"
import { type ThemeListItem, ThemeProviderContext, type ThemeProviderData } from "@/contexts/theme"
import { api } from "@/lib/api"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themesList, setThemesList] = useState<ThemeListItem[] | null>(null)
  const [theme, setTheme] = useState<ThemeContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const hasLoadedSavedTheme = useRef(false)

  const applyAndPersistTheme = useCallback((themeData: ThemeContextData) => {
    applyThemeToDocument(themeData)
    setTheme(themeData)
    saveThemePreference(themeData.id)
  }, [])

  const applyTheme = useCallback(
    async (themeName: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await api.themes["by-name"]({ name: themeName }).get()

        if (fetchError || !data) {
          throw new Error(`Failed to fetch theme "${themeName}"`)
        }

        if (!data.success || !data.data) {
          throw new Error(data.message || `Theme "${themeName}" not found`)
        }

        applyAndPersistTheme({
          id: data.data.id,
          vars: data.data.variables ?? {},
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    },
    [applyAndPersistTheme]
  )

  const applyThemeById = useCallback(
    async (themeId: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await api.themes["by-id"]({ id: themeId }).get()

        if (fetchError || !data) {
          throw new Error(`Failed to fetch theme with id ${themeId}`)
        }

        if (!data.success || !data.data) {
          throw new Error(data.message || `Theme with id ${themeId} not found`)
        }

        applyAndPersistTheme({
          id: data.data.id,
          vars: data.data.variables ?? {},
        })
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    },
    [applyAndPersistTheme]
  )

  const getAllThemes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await api.themes.get()

      if (fetchError || !data) {
        throw new Error("Failed to fetch themes")
      }

      if (!data.success || !data.data) {
        throw new Error(data.message || "Failed to fetch themes")
      }

      const themesData: ThemeListItem[] = data.data.map((t) => ({
        id: t.id,
        name: t.name,
        variables: t.variables ?? {},
      }))

      setThemesList(themesData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasLoadedSavedTheme.current) return
    hasLoadedSavedTheme.current = true

    const savedThemeId = loadThemePreference()
    if (savedThemeId != null) {
      void applyThemeById(savedThemeId)
    }
  }, [applyThemeById])

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
