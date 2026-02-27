import type { ThemeBrowserItem } from "@dockstat/ui"
import { createContext, type Dispatch, type SetStateAction } from "react"

export const ThemeSidebarContext = createContext<{
  isThemeSidebarOpen: boolean
  setIsThemeSidebarOpen: Dispatch<SetStateAction<boolean>>
  addNewTheme: (
    name: string,
    animations: Record<string, unknown>,
    variables: Record<string, string>
  ) => Promise<void>
  themeProps?: {
    currentThemeColors: { colorName: string; color: string }[]
    currentThemeName: string
    onColorChange: (colorValue: string, colorName: string) => void
    themes: ThemeBrowserItem[]
    currentThemeId: number | null
    onSelectTheme: (theme: ThemeBrowserItem) => void | Promise<void>
    toastSuccess: (_: string) => void
    onOpen: () => void
  }
  setThemeProps: Dispatch<
    SetStateAction<
      | {
          currentThemeColors: { colorName: string; color: string }[]
          currentThemeName: string
          onColorChange: (colorValue: string, colorName: string) => void
          themes: ThemeBrowserItem[]
          currentThemeId: number | null
          onSelectTheme: (theme: ThemeBrowserItem) => void | Promise<void>
          toastSuccess: (_: string) => void
          onOpen: () => void
        }
      | undefined
    >
  >
}>({
  addNewTheme: async () => {},
  isThemeSidebarOpen: false,
  setIsThemeSidebarOpen: () => {},
  setThemeProps: () => {},
})
