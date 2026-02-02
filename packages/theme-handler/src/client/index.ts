export type { ThemeContextData } from "./lib/context"
export { ThemeContext } from "./lib/context"

export type { ThemeFromServer } from "./lib/fetchTheme"

export { applyThemeToDocument } from "./lib/fetchTheme"

export {
  clearThemePreference,
  loadThemePreference,
  saveThemePreference,
} from "./lib/storage"
