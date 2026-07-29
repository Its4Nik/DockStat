import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import { useEdenClient } from "@dockstat/utils/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { type ThemeListItem, ThemeProviderContext, type ThemeProviderData } from "@/contexts/theme"
import { useThemeMutations } from "@/hooks/mutations"
import { api } from "@/lib/api"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const eden = useEdenClient()
  const [theme, setTheme] = useState<ThemeContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModifiedTheme, setIsModifiedTheme] = useState<boolean>(false)
  const hasLoadedSavedTheme = useRef(false)

  const { data: ThemesRes } = eden.query({
    queryKey: ["fetchAllThemes"],
    route: api.themes.get,
  })

  const themesList: ThemeListItem[] | null = ThemesRes?.data ?? null

  const { createThemeMutation: createNewThemeFromCurrent } = useThemeMutations()

  const applyThemeEffect = useCallback((themeData: ThemeContextData) => {
    applyThemeToDocument(themeData)
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
        const { data, error: fetchError } = await eden.call(
          api.themes["by-name"]({ name: themeName }).get
        )

        if (fetchError || !data) {
          throw new Error(`Failed to fetch theme "${themeName}"`)
        }

        const themeResponse = data as {
          success?: boolean
          data?: { id: number; name: string; variables?: Record<string, string> }
          message?: string
        }
        if (!themeResponse.success || !themeResponse.data) {
          throw new Error(themeResponse.message || `Theme "${themeName}" not found`)
        }

        const themeData = {
          id: themeResponse.data.id,
          name: themeResponse.data.name,
          vars: themeResponse.data.variables ?? {},
        }
        applyAndPersistTheme(themeData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    },
    [applyAndPersistTheme, eden]
  )

  const applyThemeById = useCallback(
    async (themeId: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await eden.call(
          api.themes["by-id"]({ id: themeId }).get
        )

        if (fetchError || !data) {
          throw new Error(`Failed to fetch theme with id ${themeId}`)
        }

        const themeResponse = data as {
          success?: boolean
          data?: { id: number; name: string; variables?: Record<string, string> }
          message?: string
        }
        if (!themeResponse.success || !themeResponse.data) {
          throw new Error(themeResponse.message || `Theme with id ${themeId} not found`)
        }

        const themeData = {
          id: themeResponse.data.id,
          name: themeResponse.data.name,
          vars: themeResponse.data.variables ?? {},
        }
        applyAndPersistTheme(themeData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    },
    [applyAndPersistTheme, eden]
  )

  useEffect(() => {
    if (hasLoadedSavedTheme.current) return
    hasLoadedSavedTheme.current = true

    const preference = loadThemePreference()

    if (preference !== null) {
      void applyThemeById(preference.id)
    }
  }, [applyThemeById])

  const handleCreateNewTheme = useCallback(
    async (input: Parameters<typeof createNewThemeFromCurrent.mutateAsync>[0]) => {
      try {
        const result = await createNewThemeFromCurrent.mutateAsync(input)
        setIsModifiedTheme(false)
        return result
      } catch (err) {
        setIsModifiedTheme(true)
        throw err
      }
    },
    [createNewThemeFromCurrent]
  )

  type input = Parameters<typeof createNewThemeFromCurrent.mutateAsync>[0]
  type routeType = Awaited<ReturnType<typeof api.themes.post>>["data"]

  const providerValue = useMemo<ThemeProviderData<routeType, input>>(
    () => ({
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
    }),
    [
      adjustCurrentTheme,
      applyTheme,
      applyThemeById,
      handleCreateNewTheme,
      createNewThemeFromCurrent,
      error,
      isLoading,
      isModifiedTheme,
      theme,
      themesList,
    ]
  )

  return <ThemeProviderContext value={providerValue}>{children}</ThemeProviderContext>
}
