import type { ConnectionConfig } from "../modules/base/types"

/**
 * Converts an object of parameters into a URL query string.
 * Handles strings, numbers, booleans, and JSON serializable objects.
 */
export function buildQueryString(params?: object): string | undefined {
  if (!params) return undefined

  const urlParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue

    if (typeof value === "string") {
      urlParams.append(key, value)
    } else if (typeof value === "number" || typeof value === "boolean") {
      urlParams.append(key, value.toString())
    } else {
      urlParams.append(key, JSON.stringify(value))
    }
  }

  return urlParams.toString()
}

/**
 * Constructs the full request URL based on the connection mode (Unix/Http) and API version.
 */
export function buildDockerUrl(
  config: ConnectionConfig,
  path: string,
  query: string | undefined,
  apiVersion: string
): string {
  const queryString = query ? `?${query}` : ""

  if (config.mode === "unix") {
    // In Unix mode, the hostname doesn't matter
    return `http://localhost/${apiVersion}${path}${queryString}`
  }

  // HTTP/HTTPS mode
  const baseUrl = config.baseUrl || ""
  const separator = baseUrl.endsWith("/") ? "" : "/"

  return `${baseUrl}${separator}${apiVersion}${path}${queryString}`
}
