import { useState } from "react"
import { ThemeSidebarContext } from "@/contexts/themeSidebar"

export function ThemeSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isThemeSidebarOpen, setIsThemeSidebarOpen] = useState<boolean>(false)
  const [themeProps, setThemeProps] = useState<{
    currentThemeColors: { colorName: string; color: string }[]
    currentThemeName: string
    onColorChange: (colorValue: string, colorName: string) => void
    themes: import("@dockstat/ui").ThemeBrowserItem[]
    currentThemeId: number | null
    onSelectTheme: (theme: import("@dockstat/ui").ThemeBrowserItem) => void | Promise<void>
    toastSuccess: () => void
    onOpen: () => void
  }>()

  return (
    <ThemeSidebarContext
      value={{
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
