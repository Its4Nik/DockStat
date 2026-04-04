import type { BodyInit, HeadersInit } from "bun"
import { DockerWebSocket } from "../_socket"
import type { ConnectionConfig, HttpMethod } from "./types"
import { buildDockerUrl, buildQueryString } from "../../utils/url"
import { prepareRequestOptions } from "../../utils/request-options"
import { handleDockerResponse } from "../../utils/response"

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
    const dockerApiVersion = this.config.dockerAPIVersion || "1.54"
    const query = buildQueryString(params)
    const url = buildDockerUrl(this.config, path, query, dockerApiVersion)

    const options = prepareRequestOptions(this.config, method, body, headers, url)

    const response = await fetch(url, options)

    return handleDockerResponse(response, path, dockerApiVersion, params)
  }
}
