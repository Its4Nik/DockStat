import type { ConnectionConfig } from "../modules/base/types"

/**
 * Convert an object of parameters into a URL query string.
 *
 * Handles the following value types:
 * - `string` — appended as-is
 * - `number` — converted via `toString()`
 * - `boolean` — converted via `toString()` (produces `"true"` or `"false"`)
 * - `object` (other) — serialized via `JSON.stringify()`
 * - `undefined` — skipped (key is omitted from the query string)
 *
 * If `params` is `undefined`, `null`, or an empty object, returns `undefined`.
 *
 * @param params - An object whose entries become query parameters.
 * @returns A URL-encoded query string (without the leading `?`), or `undefined` if no params.
 *
 * @example
 * ```ts
 * buildQueryString({ all: true, limit: 10, filters: JSON.stringify({ status: ["running"] }) })
 * // => "all=true&limit=10&filters=%22..."
 *
 * buildQueryString({ foo: undefined, bar: "baz" })
 * // => "bar=baz"
 * ```
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
 * Construct the full request URL based on the connection mode and API version.
 *
 * For **Unix socket mode**, the URL always uses `http://localhost` as the base
 * (the actual socket path is configured separately via `BunFetchRequestInit.unix`).
 *
 * For **TCP/npipe mode**, the URL is constructed from the configured `baseUrl`.
 * A `/` separator is added between the base URL and the API version path
 * if the base URL does not already end with `/`.
 *
 * @param config - The Docker connection configuration.
 * @param path - The API endpoint path (e.g., `/containers/json`). Should start with `/`.
 * @param query - An optional pre-built query string (without the leading `?`).
 * @param apiVersion - The Docker Engine API version (e.g., `"1.54"`).
 * @returns The full URL string ready to pass to `fetch()`.
 *
 * @example
 * ```ts
 * // Unix mode
 * buildDockerUrl({ mode: "unix" }, "/containers/json", "all=true", "1.54")
 * // => "http://localhost/1.54/containers/json?all=true"
 *
 * // TCP mode
 * buildDockerUrl({ mode: "tcp", baseUrl: "http://192.168.1.1:2375" }, "/images/json", undefined, "1.54")
 * // => "http://192.168.1.1:2375/1.54/images/json"
 * ```
 */
export function buildDockerUrl(
  config: ConnectionConfig,
  path: string,
  query: string | undefined,
  apiVersion: string
): string {
  const queryString = query ? `?${query}` : ""

  if (config.mode === "unix" || config.mode === "npipe") {
    // In Unix/npipe mode, the hostname doesn't matter
    return `http://localhost/${apiVersion}${path}${queryString}`
  }

  // HTTP/HTTPS mode
  const baseUrl = config.baseUrl || ""
  const separator = baseUrl.endsWith("/") ? "" : "/"

  return `${baseUrl}${separator}${apiVersion}${path}${queryString}`
}
