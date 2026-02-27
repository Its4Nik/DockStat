import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import { useCallback, useEffect, useRef, useState } from "react"
import { type ThemeListItem, ThemeProviderContext, type ThemeProviderData } from "@/contexts/theme"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { api } from "@/lib/api"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themesList, setThemesList] = useState<ThemeListItem[] | null>(null)
  const [theme, setTheme] = useState<ThemeContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModifiedTheme, setIsModifiedTheme] = useState<boolean>(false)
  const hasLoadedSavedTheme = useRef(false)

  const { data: ThemesRes } = useEdenQuery({
    route: api.themes.get,
    queryKey: ["fetchAllThemes"],
  })

  const applyAndPersistTheme = useCallback((themeData: ThemeContextData) => {
    console.log("Applying theme:", themeData)
    applyThemeToDocument(themeData, (msg) => console.log("Theme applied:", msg))
    setTheme(themeData)
    saveThemePreference(themeData.id, themeData.name)
  }, [])

  const adjustCurrentTheme = useCallback((themeVars: ThemeContextData["vars"]) => {
    setTheme((prev) => {
      if (!prev) return prev

      // Merge the new theme vars with the existing ones to preserve all colors
      const mergedVars = { ...prev.vars, ...themeVars }

      // Apply the merged theme to the document
      applyThemeToDocument({ ...prev, vars: mergedVars })

      // Return the updated theme with all colors preserved
      return { ...prev, vars: mergedVars }
    })
  }, [])

  const createNewThemeFromCurrent = useEdenMutation({
    mutationKey: ["createNewThemeFromCurrent"],
    route: api.themes.post,
    invalidateQueries: [],
    toast: {
      errorTitle: () => {
        setIsModifiedTheme(true)
        return "Could not create new Theme"
      },
      successTitle: () => {
        setIsModifiedTheme(false)
        return "Created new Theme"
      },
    },
  })

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

        const themeData = {
          name: data.data.name,
          id: data.data.id,
          vars: data.data.variables ?? {},
        }
        console.log("Theme data fetched:", themeData)
        applyAndPersistTheme(themeData)
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

        const themeData = {
          id: data.data.id,
          name: data.data.name,
          vars: data.data.variables ?? {},
        }
        console.log("Theme data fetched by ID:", themeData)
        applyAndPersistTheme(themeData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    },
    [applyAndPersistTheme]
  )

  useEffect(() => {
    if (hasLoadedSavedTheme.current) return
    hasLoadedSavedTheme.current = true

    const preference = loadThemePreference()

    if (preference !== null) {
      void applyThemeById(preference.id)
    }
  }, [applyThemeById])

  useEffect(() => {
    if (ThemesRes?.data) {
      setThemesList(ThemesRes.data)
    }
  }, [ThemesRes?.data])

  type input = Parameters<typeof createNewThemeFromCurrent.mutateAsync>[0]
  type routeType = Awaited<ReturnType<typeof api.themes.post>>["data"]

  const providerValue: ThemeProviderData<routeType, input> = {
    theme,
    isLoading,
    error,
    applyTheme,
    applyThemeById,
    isModifiedTheme,
    themesList,
    adjustCurrentTheme,
    createNewThemeFromCurrent,
  }

  return <ThemeProviderContext value={providerValue}>{children}</ThemeProviderContext>
}
