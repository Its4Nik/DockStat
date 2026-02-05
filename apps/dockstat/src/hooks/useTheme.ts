import { useContext } from "react"
import { ThemeProviderContext } from "@/contexts/theme"

/**
 * Hook to access the theme context.
 *
 * Provides:
 * - `theme`: The currently applied theme data (or null if none)
 * - `isLoading`: Whether a theme is currently being fetched
 * - `error`: Any error that occurred during theme fetching
 * - `applyTheme(name)`: Function to fetch and apply a theme by name
 * - `applyThemeById(id)`: Function to fetch and apply a theme by ID
 *
 * @example
 * ```tsx
 * const { theme, isLoading, applyTheme } = useTheme()
 *
 * useEffect(() => {
 *   applyTheme("dark")
 * }, [applyTheme])
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeProviderContext)

  return context
}
