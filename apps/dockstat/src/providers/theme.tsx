import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import { eden } from "@dockstat/utils/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { type ThemeListItem, ThemeProviderContext, type ThemeProviderData } from "@/contexts/theme"
import { useThemeMutations } from "@/hooks/mutations"
import { api } from "@/lib/api"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModifiedTheme, setIsModifiedTheme] = useState<boolean>(false)
  const hasLoadedSavedTheme = useRef(false)

  const { data: ThemesRes } = eden.useEdenQuery({
    queryKey: ["fetchAllThemes"],
    route: api.themes.get,
  })

  const themesList: ThemeListItem[] | null = ThemesRes?.data ?? null

  const { createThemeMutation: createNewThemeFromCurrent } = useThemeMutations()

  const applyThemeEffect = useCallback((themeData: ThemeContextData) => {
    console.log("Applying theme:", themeData)
    applyThemeToDocument(themeData, (msg) => console.log("Theme applied:", msg))
  }, [])

  const applyAndPersistTheme = useCallback(
    (themeData: ThemeContextData) => {
      applyThemeEffect(themeData)
      setTheme(themeData)
      saveThemePreference(themeData.id, themeData.name)
    },
    [applyThemeEffect]
  )

  const adjustCurrentTheme = useCallback(
    (themeVars: ThemeContextData["vars"]) => {
      setTheme((prev) => {
        if (!prev) return prev
        const mergedVars = { ...prev.vars, ...themeVars }
        const nextTheme = { ...prev, vars: mergedVars }
        applyThemeEffect(nextTheme)
        return nextTheme
      })
    },
    [applyThemeEffect]
  )

  const applyTheme = useCallback(
    async (themeName: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await api.themes["by-name"]({
          name: themeName,
        }).get()

        if (fetchError || !data) {
          throw new Error(`Failed to fetch theme "${themeName}"`)
        }

        if (!data.success || !data.data) {
          throw new Error(data.message || `Theme "${themeName}" not found`)
        }

        const themeData = {
          id: data.data.id,
          name: data.data.name,
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
        const { data, error: fetchError } = await api.themes["by-id"]({
          id: themeId,
        }).get()

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

  const handleCreateNewTheme = async (
    input: Parameters<typeof createNewThemeFromCurrent.mutateAsync>[0]
  ) => {
    try {
      const result = await createNewThemeFromCurrent.mutateAsync(input)
      setIsModifiedTheme(false)
      return result
    } catch (err) {
      setIsModifiedTheme(true)
      throw err
    }
  }

  type input = Parameters<typeof createNewThemeFromCurrent.mutateAsync>[0]
  type routeType = Awaited<ReturnType<typeof api.themes.post>>["data"]

  const providerValue: ThemeProviderData<routeType, input> = {
    adjustCurrentTheme,
    applyTheme,
    applyThemeById,
    createNewThemeFromCurrent: {
      ...createNewThemeFromCurrent,
      mutateAsync: handleCreateNewTheme,
    },
    error,
    isLoading,
    isModifiedTheme,
    theme,
    themesList,
  }

  return <ThemeProviderContext value={providerValue}>{children}</ThemeProviderContext>
}
