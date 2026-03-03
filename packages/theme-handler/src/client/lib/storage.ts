const STORAGE_KEY = "dockstat-selected-theme-id"

/**
 * Save the selected theme ID to localStorage.
 * This allows the user's theme preference to persist across sessions.
 *
 * @param themeId - The ID of the selected theme
 */
export function saveThemePreference(themeId: number, themeName: string): void {
  if (typeof localStorage === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, `${themeId}|${themeName}`)
  } catch {
    // localStorage may be unavailable (e.g., private browsing mode)
    // Silently fail - theme will just not persist
  }
}

/**
 * Load the previously selected theme ID from localStorage.
 *
 * @returns The saved theme ID, or null if none was saved or localStorage is unavailable
 */
export function loadThemePreference(): { id: number; name: string } | null {
  if (typeof localStorage === "undefined") return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return null

    const storageObj = stored.split("|")

    const parsed = Number(storageObj[0])
    if (Number.isNaN(parsed)) return null

    return { id: parsed, name: storageObj[1] || "Undefined" }
  } catch {
    // localStorage may be unavailable
    return null
  }
}

/**
 * Clear the saved theme preference from localStorage.
 */
export function clearThemePreference(): void {
  if (typeof localStorage === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail
  }
}
