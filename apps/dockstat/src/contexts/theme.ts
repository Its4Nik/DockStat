import type { ThemeContextData } from "@dockstat/theme-handler/client"
import type { eden } from "@dockstat/utils/react"
import { createContext } from "react"

type MutationResult<TData, TInput> = eden.MutationResult<TData, TInput>

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
  adjustCurrentTheme: (vars: ThemeContextData["vars"]) => void
  createNewThemeFromCurrent: MutationResult<TDat, TInput>
}

export const ThemeProviderContext = createContext<ThemeProviderData<unknown, ThemeContextData>>({
  adjustCurrentTheme: () => {},
  applyTheme: async () => {},
  applyThemeById: async () => {},
  createNewThemeFromCurrent: {} as MutationResult<undefined, ThemeContextData>,
  error: null,
  isLoading: false,
  isModifiedTheme: false,
  theme: null,
  themesList: null,
})
