import type { MutationResult } from "@/hooks/eden/types"
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

export type ThemeProviderData<TDat = undefined, TInput = ThemeContextData> = {
  isModifiedTheme: boolean
  theme: ThemeContextData | null
  isLoading: boolean
  error: Error | null
  applyTheme: (themeName: string) => Promise<void>
  applyThemeById: (themeId: number) => Promise<void>
  themesList: ThemeListItem[] | null
  getAllThemes: () => Promise<void>
  adjustCurrentTheme: (vars: ThemeContextData["vars"]) => void
  createNewThemeFromCurrent: MutationResult<TDat, TInput>
}

export const ThemeProviderContext = createContext<ThemeProviderData<unknown, ThemeContextData>>({
  theme: null,
  isLoading: false,
  isModifiedTheme: false,
  error: null,
  applyTheme: async () => {},
  applyThemeById: async () => {},
  themesList: null,
  getAllThemes: async () => {},
  adjustCurrentTheme: () => {},
  createNewThemeFromCurrent: {} as MutationResult<undefined, ThemeContextData>,
})
