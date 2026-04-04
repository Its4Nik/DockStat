import type { BodyInit, HeadersInit } from "bun"
import type { ConnectionConfig, HttpMethod } from "../types"

export function prepareRequestOptions(
  config: ConnectionConfig,
  method: HttpMethod,
  body?: BodyInit | Record<string, unknown>,
  headers?: HeadersInit,
  url?: string
): BunFetchRequestInit {
  const isJsonBody = typeof body === "object" && !(body instanceof FormData) && body !== undefined

  const options: BunFetchRequestInit = {
    method,
    headers: {
      Host: "localhost", // Default fallback
      ...(isJsonBody && { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
    body: isJsonBody ? JSON.stringify(body) : (body as BodyInit),
  }

  if (config.mode !== "unix" && url) {
    try {
      const urlObj = new URL(url)
      options.headers = { ...options.headers, Host: urlObj.host }
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
