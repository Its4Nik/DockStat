import type { ThemeContextData } from "./context"

/**
 * The shape of the theme returned by the server.
 * This should match the server-side themeType.
 */
export type ThemeFromServer = {
  id: number
  name: string
  variables: Record<string, string>
  animations: Record<string, Record<string, string | number>>
}

/**
 * Apply a theme's variables to the document as CSS variables.
 *
 * This is intended to run in the browser only. Theme variables from the DB
 * simply override whatever Tailwind (or other CSS) variables may already exist.
 */
export const applyThemeToDocument = (
  theme: ThemeContextData,
  onFinish?: (msg: string) => void
): void => {
  if (typeof document === "undefined") return

  const root = document.documentElement

  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key.startsWith("--") ? key : `--${key}`, value)
  }

  if (onFinish) {
    onFinish(`Applied Theme ${theme.id}`)
  }
}
