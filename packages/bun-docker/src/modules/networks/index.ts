import { BaseModule } from "../base"
import type {
  CreateNetworkOptions,
  ListNetworksOptions,
  NetworkConnectRequest,
  NetworkCreateResponse,
  NetworkDisconnectRequest,
  NetworkInspect,
  NetworkPruneResponse,
  NetworkSummary,
  PruneNetworksOptions,
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
  async list(options?: ListNetworksOptions): Promise<NetworkSummary[]> {
    const params = new URLSearchParams()

    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/networks${query ? `?${query}` : ""}`
    const res = await this.request(path, "GET")
    return (await res.json()) as NetworkSummary[]
  }

  /**
   * Create a network
   * @param config - Network configuration
   * @returns Network create response with ID and warnings
   */
  async create(config: CreateNetworkOptions): Promise<NetworkCreateResponse> {
    const res = await this.request("/networks/create", "POST", config)
    return (await res.json()) as NetworkCreateResponse
  }

  /**
   * Inspect a network
   * @param id - Network ID or name
   * @param options - Inspect options
   * @returns Detailed network information
   */
  async inspect(
    id: string,
    options?: { verbose?: boolean; scope?: string }
  ): Promise<NetworkInspect> {
    const params = new URLSearchParams()

    if (options?.verbose) params.append("verbose", "true")
    if (options?.scope) params.append("scope", options.scope)

    const query = params.toString()
    const path = `/networks/${id}${query ? `?${query}` : ""}`
    const res = await this.request(path, "GET")
    return (await res.json()) as NetworkInspect
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
  async connect(id: string, request: NetworkConnectRequest): Promise<void> {
    await this.request(`/networks/${id}/connect`, "POST", request)
  }

  /**
   * Disconnect a container from a network
   * @param id - Network ID or name
   * @param request - Disconnection request with container and force option
   */
  async disconnect(id: string, request: NetworkDisconnectRequest): Promise<void> {
    await this.request(`/networks/${id}/disconnect`, "POST", request)
  }

  /**
   * Remove unused networks
   * @param options - Prune options including filters
   * @returns Prune response with deleted networks
   */
  async prune(options?: PruneNetworksOptions): Promise<NetworkPruneResponse> {
    const params = new URLSearchParams()

    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/networks/prune${query ? `?${query}` : ""}`
    const res = await this.request(path, "POST")
    return (await res.json()) as NetworkPruneResponse
  }
}
