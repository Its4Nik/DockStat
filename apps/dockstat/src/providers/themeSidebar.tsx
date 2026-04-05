import { useState } from "react"
import { ThemeSidebarContext } from "@/contexts/ThemeSidebarContext"
import { ThemeSidebarUIProvider } from "@/contexts/ThemeSidebarUIContext"
import { useThemeMutations } from "@/hooks/mutations"
import { useTheme } from "@/hooks/useTheme"

export function ThemeSidebarProvider({ children }: { children: React.ReactNode }) {
  const themeCtx = useTheme()
  const [isThemeSidebarOpen, setIsThemeSidebarOpen] = useState(false)

  const { createThemeMutation } = useThemeMutations()

  const addNewTheme = async (
    name: string,
    animations: Record<string, unknown>,
    variables: Record<string, string>
  ) => {
    const res = await createThemeMutation.mutateAsync({
      name,
      animations,
      variables,
    })

    themeCtx.applyThemeById(res.data.id)
  }

  return (
    <ThemeSidebarUIProvider value={{ isThemeSidebarOpen, setIsThemeSidebarOpen }}>
      <ThemeSidebarContext.Provider value={{ addNewTheme }}>
        {children}
      </ThemeSidebarContext.Provider>
    </ThemeSidebarUIProvider>
  )
}
