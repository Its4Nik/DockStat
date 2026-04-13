import type { BodyInit, HeadersInit } from "bun"
import type { ConnectionConfig, HttpMethod } from "../modules/base/types"

/**
 * Prepare the full set of request options for a Bun `fetch` call to the Docker API.
 *
 * Handles:
 * - JSON body serialization (sets `Content-Type: application/json` for object bodies)
 * - Custom header merging (supports `Headers`, array, and plain object formats)
 * - Host header setting (defaults to `localhost` for Unix sockets; derived from URL for TCP)
 * - Unix socket path configuration via `BunFetchRequestInit.unix`
 * - TLS options passthrough
 *
 * @param config - The Docker connection configuration.
 * @param method - The HTTP method to use.
 * @param body - Optional request body. Objects are serialized as JSON.
 * @param headers - Optional additional headers to merge with the defaults.
 * @param url - The full request URL (used to derive the `Host` header for TCP mode).
 * @returns A `BunFetchRequestInit` object ready to pass to `fetch()`.
 *
 * @example
 * ```ts
 * const options = prepareRequestOptions(config, "POST", { name: "my-container" })
 * const response = await fetch(url, options)
 * ```
 */
export function prepareRequestOptions(
  config: ConnectionConfig,
  method: HttpMethod,
  body?: BodyInit | object,
  headers?: HeadersInit,
  url?: string
): BunFetchRequestInit {
  const isJsonBody = typeof body === "object" && !(body instanceof FormData) && body !== undefined

  const baseHeaders: Record<string, string> = {
    Host: "localhost",
  }

  if (isJsonBody) {
    baseHeaders["Content-Type"] = "application/json"
  }

  // Merge additional headers
  if (headers) {
    if (headers instanceof Headers) {
      // Handle Headers instance
      headers.forEach((value, key) => {
        baseHeaders[key] = value
      })
    } else if (Array.isArray(headers)) {
      // Handle array format [key, value][]
      for (const [key, value] of headers) {
        if (key !== undefined) {
          const pKey = String(key)
          const pVal = String(value)
          baseHeaders[pKey] = pVal
        }
      }
    } else {
      // Handle plain object
      Object.assign(baseHeaders, headers)
    }
  }

  const requestBody = isJsonBody ? JSON.stringify(body) : (body as BodyInit)

  const options: BunFetchRequestInit = {
    body: requestBody,
    headers: baseHeaders,
    method,
  }

  // Set Host header from URL for TCP mode
  if (config.mode !== "unix" && url) {
    try {
      const urlObj = new URL(url)
      // biome-ignore lint: Needed for dts-bundle-generator
      baseHeaders["Host"] = urlObj.host
    } catch {
      // Ignore URL parsing errors, keep default Host
    }
  }

  // Configure Unix socket
  if (config.mode === "unix" && config.socketPath) {
    options.unix = config.socketPath
  }

  // Configure TLS
  if (config.tls) {
    options.tls = config.tls
  }
  return options
}
