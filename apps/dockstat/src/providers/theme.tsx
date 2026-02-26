import {
  applyThemeToDocument,
  loadThemePreference,
  saveThemePreference,
  type ThemeContextData,
} from "@dockstat/theme-handler/client"
import { useCallback, useEffect, useRef, useState } from "react"
import { type ThemeListItem, ThemeProviderContext, type ThemeProviderData } from "@/contexts/theme"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themesList, setThemesList] = useState<ThemeListItem[] | null>(null)
  const [theme, setTheme] = useState<ThemeContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModifiedTheme, setIsModifiedTheme] = useState<boolean>(false)
  const hasLoadedSavedTheme = useRef(false)

  const applyAndPersistTheme = useCallback((themeData: ThemeContextData) => {
    applyThemeToDocument(themeData)
    setTheme(themeData)
    saveThemePreference(themeData.id, themeData.name)
  }, [])

  const adjustCurrentTheme = useCallback((themeVars: ThemeContextData["vars"]) => {
    applyThemeToDocument(themeVars)
    setTheme((prev) => (prev ? { ...prev, vars: themeVars } : prev))
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
        getAllThemes()
          .then(() => {
            toast({
              description: "Updated the Theme Cache",
              title: "Theme Cache",
              variant: "success",
            })
          })
          .catch(() => {
            toast({
              description: "Could not update the Theme Cache",
              title: "Theme Cache",
              variant: "error",
            })
          })
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

        applyAndPersistTheme({
          name: data.data.name,
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
          name: data.data.name,
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

    const preference = loadThemePreference()

    if (preference !== null) {
      void applyThemeById(preference.id)
    }
  }, [applyThemeById])

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
    getAllThemes,
    adjustCurrentTheme,
    createNewThemeFromCurrent,
  }

  return <ThemeProviderContext value={providerValue}>{children}</ThemeProviderContext>
}
