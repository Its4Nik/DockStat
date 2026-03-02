import { createContext, useContext, Dispatch, SetStateAction } from "react"

type ThemeSidebarUIContextValue = {
  isThemeSidebarOpen: boolean
  setIsThemeSidebarOpen: Dispatch<SetStateAction<boolean>>
}

const ThemeSidebarUIContext = createContext<ThemeSidebarUIContextValue | undefined>(undefined)

export const useThemeSidebarUI = () => {
  const context = useContext(ThemeSidebarUIContext)
  if (!context) {
    throw new Error("useThemeSidebarUI must be used within a ThemeSidebarUIProvider")
  }
  return context
}

export const ThemeSidebarUIProvider = ThemeSidebarUIContext.Provider
