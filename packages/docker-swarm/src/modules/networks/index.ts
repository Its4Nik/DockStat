/**
 * Networks Module (Swarm-specific)
 *
 * Provides operations for Docker Swarm network management.
 */

import Docker from "dockerode"
import type {
  DockerConnectionOptions,
  SwarmNetworkCreateOptions,
  SwarmNetworkInfo,
} from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"

/**
 * Networks Module
 *
 * Manages Docker Swarm network operations.
 */
export class NetworksModule {
  private docker: Docker
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * List all networks
   */
  async list(scope?: "local" | "swarm"): Promise<SwarmNetworkInfo[]> {
    const filters: Record<string, string[]> = {}

    if (scope) {
      filters.scope = [scope]
    }

    const networks = await this.docker.listNetworks({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    })

    return networks.map((network) => this.mapNetworkInfo(network))
  }

  /**
   * List swarm networks only
   */
  async listSwarmNetworks(): Promise<SwarmNetworkInfo[]> {
    return this.list("swarm")
  }

  /**
   * Get a specific network by ID
   */
  async get(networkId: string): Promise<SwarmNetworkInfo> {
    try {
      const network = await this.docker.getNetwork(networkId).inspect()
      return this.mapNetworkInfo(network)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      throw error
    }
  }

  /**
   * Create a new swarm network (overlay)
   */
  async create(options: SwarmNetworkCreateOptions): Promise<SwarmNetworkInfo> {
    try {
      const network = await this.docker.createNetwork({
        Name: options.name,
        Driver: options.driver ?? "overlay",
        Attachable: options.attachable,
        Ingress: options.ingress,
        Internal: options.internal,
        EnableIPv6: options.enableIPv6,
        IPAM: options.ipam
          ? {
              Driver: options.ipam.driver,
              Config: options.ipam.config?.map((c) => ({
                Subnet: c.subnet,
                IPRange: c.ipRange,
                Gateway: c.gateway,
              })),
              Options: options.ipam.options,
            }
          : undefined,
        Options: options.options,
        Labels: options.labels,
        CheckDuplicate: options.checkDuplicate,
      })

      // Inspect to get full info
      const created = await network.inspect()
      return this.mapNetworkInfo(created)
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("already exists")) {
        throw new SwarmError(
          SwarmErrorCode.NETWORK_NAME_CONFLICT,
          `Network name '${options.name}' already exists`
        )
      }
      throw error
    }
  }

  /**
   * Remove a network
   */
  async remove(networkId: string): Promise<void> {
    try {
      const network = this.docker.getNetwork(networkId)
      await network.remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      const message = (error as Error).message
      if (message.includes("has active endpoints")) {
        throw new SwarmError(
          SwarmErrorCode.NETWORK_IN_USE,
          `Network ${networkId} is in use and cannot be removed`
        )
      }
      throw error
    }
  }

  /**
   * Get network by name
   */
  async getByName(name: string): Promise<SwarmNetworkInfo | undefined> {
    const networks = await this.docker.listNetworks({
      filters: { name: [name] },
    })
    const network = networks[0]
    return network ? this.mapNetworkInfo(network) : undefined
  }

  /**
   * Create an overlay network for swarm
   */
  async createOverlay(
    name: string,
    options: Partial<SwarmNetworkCreateOptions> = {}
  ): Promise<SwarmNetworkInfo> {
    return this.create({
      name,
      driver: "overlay",
      attachable: true,
      ...options,
    })
  }

  /**
   * Connect a service to a network
   *
   * Note: This is typically done via service update, but this method
   * provides a direct network connection API.
   */
  async connect(
    networkId: string,
    containerId: string,
    options?: {
      aliases?: string[]
      ip?: string
    }
  ): Promise<void> {
    try {
      const network = this.docker.getNetwork(networkId)
      await network.connect({
        Container: containerId,
        EndpointConfig: {
          Aliases: options?.aliases,
          IPAMConfig: options?.ip
            ? {
                IPv4Address: options.ip,
              }
            : undefined,
        },
      })
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      throw error
    }
  }

  /**
   * Disconnect a container from a network
   */
  async disconnect(networkId: string, containerId: string, force = false): Promise<void> {
    try {
      const network = this.docker.getNetwork(networkId)
      await network.disconnect({
        Container: containerId,
        Force: force,
      })
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      throw error
    }
  }

  /**
   * Map Docker network response to SwarmNetworkInfo
   */
  private mapNetworkInfo(network: Docker.NetworkInfo): SwarmNetworkInfo {
    return {
      name: network.Name ?? "",
      id: network.Id ?? "",
      created: network.Created ?? "",
      scope: (network.Scope as "local" | "swarm") ?? "local",
      driver: (network.Driver as SwarmNetworkInfo["driver"]) ?? "bridge",
      attachable: network.Attachable,
      ingress: network.Ingress,
      internal: network.Internal,
      enableIPv6: network.EnableIPv6,
      ipam: network.IPAM
        ? {
            driver: network.IPAM.Driver,
            config: network.IPAM.Config?.map((c) => ({
              subnet: c.Subnet,
              ipRange: c.IPRange,
              gateway: c.Gateway,
            })),
            options: network.IPAM.Options,
          }
        : undefined,
      labels: network.Labels,
      options: network.Options,
    }
  }
}

export * from "./types"
