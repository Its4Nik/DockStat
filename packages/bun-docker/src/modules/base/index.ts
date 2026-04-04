import type { BodyInit, HeadersInit } from "bun"
import { DockerError } from "../../utils/error"
import { DockerWebSocket } from "../socket"
import type { ConnectionConfig, HttpMethod } from "./types"

export class BaseModule {
  constructor(private config: ConnectionConfig) {}

  protected ws = new DockerWebSocket()

  async request(
    path: string,
    method: HttpMethod = "GET",
    body?: BodyInit | Record<string, unknown>,
    headers?: HeadersInit,
    params?: Record<string, string | boolean | number | unknown>
  ) {
    let url: string
    let urlParams: URLSearchParams | null = null

    if (params) {
      urlParams = new URLSearchParams()
    }

    for (const [key, value] of Object.entries(params || {})) {
      const val = value
      if (value !== undefined) {
        if (typeof val === "string") {
          urlParams.append(key, val)
          continue
        }
        if (typeof val === "number" || typeof val === "number" || typeof val === "boolean") {
          urlParams.append(key, val.toString())
          continue
        }
        urlParams.append(key, JSON.stringify(val))
      }
    }

    const query = urlParams ? urlParams.toString() : undefined
    const dockerApiVersion = this.config.dockerAPIVersion ? this.config.dockerAPIVersion : "1.54"

    const options: BunFetchRequestInit = {
      method,
      headers: {
        Host: "localhost", // Default, overwritten below if needed
        ...(typeof body === "object" && body !== null && { "Content-Type": "application/json" }),
        ...(headers || {}),
      },
    }

    if (typeof body === "object" && !(body instanceof FormData) && body !== undefined) {
      options.body = JSON.stringify(body)
    } else {
      options.body = body as BodyInit
    }

    if (this.config.mode === "unix") {
      url = `http://localhost/${dockerApiVersion}${path}${query ? `?${query}` : ""}`
      options.unix = this.config.socketPath
    } else {
      url = `${this.config.baseUrl}${this.config.baseUrl?.endsWith("/") ? `${dockerApiVersion}` : `/${dockerApiVersion}`}${path}${query ? `?${query}` : ""}`

      try {
        const urlObj = new URL(url)
        options.headers = { ...options.headers, Host: urlObj.host }
      } catch (_) {
        // Ignore parsing errors
      }
    }

    if (this.config.tls) {
      options.tls = this.config.tls
    }

    const response = await fetch(url, options)
    if (!response.ok) {
      let text = await response.text()

      try {
        const msg = JSON.parse(text).message

        if (msg) {
          text = msg
        }
      } catch (_) {
        //
      }

      throw new DockerError(
        `Docker API Error (${response.status}): ${text}`,
        response.status,
        path,
        dockerApiVersion
      )
    }

    return response
  }
}
