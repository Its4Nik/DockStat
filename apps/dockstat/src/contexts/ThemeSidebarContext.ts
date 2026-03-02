import { createContext, useContext } from "react"

type ThemeSidebarContextValue = {
  addNewTheme: (
    name: string,
    animations: Record<string, unknown>,
    variables: Record<string, string>
  ) => Promise<void>
}

export const ThemeSidebarContext = createContext<ThemeSidebarContextValue | undefined>(undefined)

export const useThemeSidebar = () => {
  const context = useContext(ThemeSidebarContext)
  if (!context) {
    throw new Error("useThemeSidebar must be used within a ThemeSidebarProvider")
  }
  return context
}

export const ThemeSidebarProvider = ThemeSidebarContext.Provider
