import type { BodyInit, HeadersInit } from "bun"
import { DEFAULT_API_VERSION } from "../../utils/env"
import { DockerLogger, resolveLoggerConfig } from "../../utils/logger"
import { prepareRequestOptions } from "../../utils/request-options"
import { handleDockerResponse } from "../../utils/response"
import { buildDockerUrl, buildQueryString } from "../../utils/url"
import { DockerWebSocket } from "../_socket"
import type { ConnectionConfig, HttpMethod } from "./types"

/**
 * Base module that provides the core HTTP request functionality
 * for all Docker API modules.
 *
 * Handles URL building, request option preparation, response validation,
 * and optional request/response logging.
 *
 * All API modules (containers, images, networks, etc.) extend this class.
 */
export class BaseModule {
  /** The Docker connection configuration. */
  protected readonly config: ConnectionConfig

  /** Logger instance for request/response logging. */
  protected readonly logger: DockerLogger

  /** WebSocket handler for streaming attach operations. */
  protected readonly ws = new DockerWebSocket()

  /**
   * Create a new BaseModule instance.
   *
   * @param config - The Docker connection configuration, including mode, socket path, TLS options, and logger config.
   */
  constructor(config: ConnectionConfig) {
    this.config = config
    this.logger = new DockerLogger(resolveLoggerConfig(config.logger))
  }

  /**
   * Make an HTTP request to the Docker Engine API.
   *
   * Builds the full URL from the connection config, prepares request options
   * (including Unix socket, TLS, headers), executes the request, and validates
   * the response. If the response indicates an error, a `DockerError` is thrown.
   *
   * When logging is enabled, logs the request method, path, status code, and duration.
   *
   * @param path - The API endpoint path (e.g., `/containers/json`). Must start with `/`.
   * @param method - The HTTP method to use. Defaults to `"GET"`.
   * @param body - Optional request body. Objects are automatically serialized as JSON.
   * @param headers - Optional additional headers to include in the request.
   * @param params - Optional query parameters to append to the URL.
   * @returns The raw `Response` object if the request succeeded (`response.ok === true`).
   * @throws {DockerError} If the Docker API returns a non-OK status code.
   *
   * @example
   * ```ts
   * const response = await this.request("/containers/json", "GET", undefined, undefined, { all: true })
   * const containers = await response.json()
   * ```
   */
  async request(
    path: string,
    method: HttpMethod = "GET",
    body?: BodyInit | object,
    headers?: HeadersInit,
    params?: object
  ): Promise<Response> {
    const dockerApiVersion = this.config.dockerAPIVersion || DEFAULT_API_VERSION
    const query = buildQueryString(params)
    const url = buildDockerUrl(this.config, path, query, dockerApiVersion)

    const options = prepareRequestOptions(this.config, method, body, headers, url)

    const startTime = Date.now()

    this.logger.debug("request start", {
      hasBody: body !== undefined,
      method,
      path,
      url: this.config.mode === "unix" ? `${this.config.mode}://[socket]${path}` : url,
    })

    let response: Response
    try {
      response = await fetch(url, options)
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error("request failed", {
        duration,
        error: error instanceof Error ? error.message : String(error),
        method,
        path,
      })
      throw error
    }

    const duration = Date.now() - startTime

    if (response.ok) {
      this.logger.debug("request complete", {
        duration,
        method,
        path,
        status: response.status,
      })
    } else {
      this.logger.warn("request error response", {
        duration,
        method,
        path,
        status: response.status,
        statusText: response.statusText,
      })
    }

    return handleDockerResponse(response, path, dockerApiVersion, params)
  }
}
