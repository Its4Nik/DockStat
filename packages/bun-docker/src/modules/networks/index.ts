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
    const res = await this.request(`/networks`, "GET", undefined, undefined, options)
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
    const res = await this.request(`/networks/${id}`, "GET", undefined, undefined, options)
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
    const res = await this.request(`/networks/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as NetworkPruneResponse
  }
}
