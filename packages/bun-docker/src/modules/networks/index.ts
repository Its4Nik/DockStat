import { BaseModule } from "../base"
import type {
  NetworkConnectRoute,
  NetworkCreateRoute,
  NetworkDisconnectRoute,
  NetworkInspectRoute,
  NetworkListRoute,
  NetworkPruneRoute,
} from "./types"

/**
 * Networks module for managing Docker networks
 */
export class NetworksModule extends BaseModule {
  /**
   * List networks
   * @param options - List options including filters
   * @returns Array of network summaries
   */
  async list(options?: NetworkListRoute["parameters"]["query"]) {
    const res = await this.request(`/networks`, "GET", undefined, undefined, options)
    return (await res.json()) as NetworkListRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Create a network
   * @param config - Network configuration
   * @returns Network create response with ID and warnings
   */
  async create(config: NetworkCreateRoute["requestBody"]["content"]["application/json"]) {
    const res = await this.request("/networks/create", "POST", config)
    return (await res.json()) as NetworkCreateRoute["responses"]["201"]
  }

  /**
   * Inspect a network
   * @param id - Network ID or name
   * @param options - Inspect options
   * @returns Detailed network information
   */
  async inspect(id: string, options?: NetworkInspectRoute["parameters"]["query"]) {
    const res = await this.request(`/networks/${id}`, "GET", undefined, undefined, options)
    return (await res.json()) as NetworkInspectRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Remove a network
   * @param id - Network ID or name
   */
  async remove(id: string): Promise<void> {
    await this.request(`/networks/${id}`, "DELETE")
  }

  /**
   * Connect a container to a network
   * @param id - Network ID or name
   * @param request - Connection request with container and endpoint config
   */
  async connect(
    id: string,
    request: NetworkConnectRoute["requestBody"]["content"]["application/json"]
  ) {
    await this.request(`/networks/${id}/connect`, "POST", request)
  }

  /**
   * Disconnect a container from a network
   * @param id - Network ID or name
   * @param request - Disconnection request with container and force option
   */
  async disconnect(
    id: string,
    request: NetworkDisconnectRoute["requestBody"]["content"]["application/json"]
  ) {
    await this.request(`/networks/${id}/disconnect`, "POST", request)
  }

  /**
   * Remove unused networks
   * @param options - Prune options including filters
   * @returns Prune response with deleted networks
   */
  async prune(options?: NetworkPruneRoute["parameters"]["query"]) {
    const res = await this.request(`/networks/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as NetworkPruneRoute["responses"]["200"]["content"]["application/json"]
  }
}
