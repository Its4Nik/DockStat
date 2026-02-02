export type { ThemeContextData } from "./lib/context"
export { ThemeContext } from "./lib/context"

export type { ThemeFromServer } from "./lib/fetchTheme"

export { applyThemeToDocument } from "./lib/fetchTheme"

export {
  saveThemePreference,
  loadThemePreference,
  clearThemePreference,
} from "./lib/storage"
