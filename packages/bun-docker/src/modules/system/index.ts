import { BaseModule } from "../base"
import type { AuthRoute, DataUsageRoute, EventsRoute, InfoRoute, VersionRoute } from "./types"

/**
 * System module for Docker API
 */
export class SystemModule extends BaseModule {
  /**
   * Check auth configuration
   * Validate credentials for a registry and get an identity token if available
   */
  async auth(config: NonNullable<AuthRoute["requestBody"]>["content"]["application/json"]) {
    const res = await this.request("/auth", "POST", config)
    return (await res.json()) as AuthRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Get system information
   * Returns system-wide information
   */
  async info() {
    const res = await this.request("/info", "GET")
    return (await res.json()) as InfoRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Get version
   * Returns the version of Docker that is running and various system information
   */
  async version() {
    const res = await this.request("/version", "GET")
    return (await res.json()) as VersionRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Ping the docker server
   * This is a dummy endpoint you can use to test if the server is accessible
   */
  async ping(): Promise<string> {
    const res = await this.request("/_ping", "GET")
    return await res.text()
  }

  /**
   * Ping the docker server using HEAD method
   * This is a dummy endpoint you can use to test if the server is accessible
   */
  async pingHead(): Promise<string> {
    const res = await this.request("/_ping", "HEAD")
    return await res.text()
  }

  /**
   * Monitor events
   * Stream docker events
   */
  async events(query?: EventsRoute["parameters"]["query"]) {
    const res = await this.request("/events", "GET", undefined, undefined, query)
    return (await res.json()) as EventsRoute["responses"]["200"]["content"]["application/json-seq"]
  }

  /**
   * Get data usage information
   * Returns data usage information for the docker daemon
   */
  async dataUsage(query?: DataUsageRoute["parameters"]["query"]) {
    const res = await this.request("/system/df", "GET", undefined, undefined, query)
    return (await res.json()) as DataUsageRoute["responses"]["200"]["content"]["application/json"]
  }
}
