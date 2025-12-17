/**
 * String utility functions
 * @module string
 */

/**
 * Truncates a string to a specified length with an ellipsis.
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - String to append when truncated (default: "...")
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, suffix = "..."): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + suffix
}

/**
 * Capitalizes the first letter of a string.
 * @param str - The string to capitalize
 * @returns String with first letter capitalized
 */
export function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Converts camelCase to kebab-case.
 * @param str - The camelCase string
 * @returns kebab-case string
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

/**
 * Converts kebab-case to camelCase.
 * @param str - The kebab-case string
 * @returns camelCase string
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Creates a URL-friendly slug from a string.
 * @param str - The string to slugify
 * @returns URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "-") // Replace special chars with dash
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, multiple dashes with single dash
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
}

/**
 * Escapes HTML special characters.
 * @param str - The string to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }

  return str.replace(/[&<>"']/g, (char) => String(htmlEscapes[char]))
}
