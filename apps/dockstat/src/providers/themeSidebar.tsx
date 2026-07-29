import { useCallback, useMemo, useState } from "react"
import { ThemeSidebarContext } from "@/contexts/ThemeSidebarContext"
import { ThemeSidebarUIProvider } from "@/contexts/ThemeSidebarUIContext"
import { useThemeMutations } from "@/hooks/mutations"
import { useTheme } from "@/hooks/useTheme"

export function ThemeSidebarProvider({ children }: { children: React.ReactNode }) {
  const themeCtx = useTheme()
  const [isThemeSidebarOpen, setIsThemeSidebarOpen] = useState(false)

  const { createThemeMutation } = useThemeMutations()

  const addNewTheme = useCallback(
    async (
      name: string,
      animations: Record<string, unknown>,
      variables: Record<string, string>
    ) => {
      const res = await createThemeMutation.mutateAsync({
        animations,
        name,
        variables,
      })

      themeCtx.applyThemeById(res.data.id)
    },
    [createThemeMutation, themeCtx.applyThemeById]
  )

  const uiValue = useMemo(
    () => ({ isThemeSidebarOpen, setIsThemeSidebarOpen }),
    [isThemeSidebarOpen, setIsThemeSidebarOpen]
  )
  const sidebarValue = useMemo(() => ({ addNewTheme }), [addNewTheme])

  return (
    <ThemeSidebarUIProvider value={uiValue}>
      <ThemeSidebarContext.Provider value={sidebarValue}>{children}</ThemeSidebarContext.Provider>
    </ThemeSidebarUIProvider>
  )
}
