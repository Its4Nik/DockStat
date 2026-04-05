import type { BodyInit, HeadersInit } from "bun"
import type { ConnectionConfig, HttpMethod } from "../modules/base/types"

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
      headers.forEach((value, key) => {
        baseHeaders[key] = value
      })
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        if (key !== undefined && value !== undefined) {
          baseHeaders[key] = value
        }
      })
    } else {
      Object.assign(baseHeaders, headers)
    }
  }

  const requestBody = isJsonBody ? JSON.stringify(body) : (body as BodyInit)

  const options: BunFetchRequestInit = {
    body: requestBody,
    headers: baseHeaders,
    method,
  }

  if (config.mode !== "unix" && url) {
    try {
      const urlObj = new URL(url)
      // biome-ignore lint: Needed for dts-bundle-generator
      baseHeaders["Host"] = urlObj.host
    } catch (_) {
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
