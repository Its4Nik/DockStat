import { useState } from "react"
import { ThemeSidebarContext } from "@/contexts/ThemeSidebarContext"
import { ThemeSidebarUIProvider } from "@/contexts/ThemeSidebarUIContext"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { useTheme } from "@/hooks/useTheme"
import { api } from "@/lib/api"

/**
 * Internal provider that handles the domain logic (addNewTheme)
 * and provides it through ThemeSidebarContext
 */
function ThemeSidebarDomainProvider({ children }: { children: React.ReactNode }) {
  const themeCtx = useTheme()

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
    <ThemeSidebarContext.Provider value={{ addNewTheme }}>{children}</ThemeSidebarContext.Provider>
  )
}

/**
 * Main provider that wraps UI state and domain logic providers.
 *
 * UI state (open/close) is managed by ThemeSidebarUIProvider.
 * Domain logic (addNewTheme) is managed by ThemeSidebarDomainProvider.
 */
export function ThemeSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isThemeSidebarOpen, setIsThemeSidebarOpen] = useState<boolean>(false)

  return (
    <ThemeSidebarUIProvider value={{ isThemeSidebarOpen, setIsThemeSidebarOpen }}>
      <ThemeSidebarDomainProvider>{children}</ThemeSidebarDomainProvider>
    </ThemeSidebarUIProvider>
  )
}
