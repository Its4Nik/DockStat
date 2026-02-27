import type { ThemeBrowserItem } from "@dockstat/ui"
import { useState } from "react"
import { ThemeSidebarContext } from "@/contexts/themeSidebar"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { useTheme } from "@/hooks/useTheme"
import { api } from "@/lib/api"

export function ThemeSidebarProvider({ children }: { children: React.ReactNode }) {
  const themeCtx = useTheme()

  const [isThemeSidebarOpen, setIsThemeSidebarOpen] = useState<boolean>(false)
  const [themeProps, setThemeProps] = useState<{
    currentThemeColors: { colorName: string; color: string }[]
    currentThemeName: string
    onColorChange: (colorValue: string, colorName: string) => void
    themes: ThemeBrowserItem[]
    currentThemeId: number | null
    onSelectTheme: (theme: ThemeBrowserItem) => void | Promise<void>
    toastSuccess: (themeName: string) => void
    onOpen: () => void
  }>()

  const addNewThemeMutation = useEdenMutation({
    mutationKey: ["addNewThemeMutation"],
    route: api.themes.post,
    toast: {
      successTitle: (input) => `Created new Theme: ${input.name}`,
      errorTitle: (input) => `Could not created new Theme: ${input.name}`,
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
    <ThemeSidebarContext
      value={{
        addNewTheme,
        isThemeSidebarOpen,
        setIsThemeSidebarOpen,
        themeProps,
        setThemeProps,
      }}
    >
      {children}
    </ThemeSidebarContext>
  )
}
