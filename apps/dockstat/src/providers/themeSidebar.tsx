import { useState } from "react"
import { ThemeSidebarContext } from "@/contexts/ThemeSidebarContext"
import { ThemeSidebarUIProvider } from "@/contexts/ThemeSidebarUIContext"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { useTheme } from "@/hooks/useTheme"
import { api } from "@/lib/api"

export function ThemeSidebarProvider({ children }: { children: React.ReactNode }) {
  const themeCtx = useTheme()
  const [isThemeSidebarOpen, setIsThemeSidebarOpen] = useState(false)

  const addNewThemeMutation = useEdenMutation({
    mutationKey: ["addNewThemeMutation"],
    route: api.themes.post,
    toast: {
      successTitle: (input) => `Created new Theme: ${input.name}`,
      errorTitle: (input) => `Could not create new Theme: ${input.name}`,
    },
  })

  const addNewTheme = async (
    name: string,
    animations: Record<string, unknown>,
    variables: Record<string, string>
  ) => {
    const res = await addNewThemeMutation.mutateAsync({
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
