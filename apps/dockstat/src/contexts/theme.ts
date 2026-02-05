import type { ThemeContextData } from "@dockstat/theme-handler/client"
import { createContext } from "react"

/**
 * Full theme data including name, for use in theme browser/listing.
 */
export type ThemeListItem = {
  id: number
  name: string
  variables: Record<string, string>
}

export type ThemeProviderData = {
  theme: ThemeContextData | null
  isLoading: boolean
  error: Error | null
  applyTheme: (themeName: string) => Promise<void>
  applyThemeById: (themeId: number) => Promise<void>
  themesList: ThemeListItem[] | null
  getAllThemes: () => Promise<void>
}

export const ThemeProviderContext = createContext<ThemeProviderData>({
  theme: null,
  isLoading: false,
  error: null,
  applyTheme: async () => {},
  applyThemeById: async () => {},
  themesList: null,
  getAllThemes: async () => {},
})
