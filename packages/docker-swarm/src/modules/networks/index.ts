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
 */
export class NetworksModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions, _logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
  }

  async list(scope?: "local" | "swarm"): Promise<SwarmNetworkInfo[]> {
    const filters: Record<string, string[]> = scope ? { scope: [scope] } : {}

    const networks = await this.docker.listNetworks({
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    } as unknown)

    return (networks as unknown[]).map((n) => this.mapNetworkInfo(n as Record<string, unknown>))
  }

  async get(networkId: string): Promise<SwarmNetworkInfo> {
    try {
      const network = await this.docker.getNetwork(networkId).inspect()
      return this.mapNetworkInfo(network as unknown as Record<string, unknown>)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      throw error
    }
  }

  async create(options: SwarmNetworkCreateOptions): Promise<SwarmNetworkInfo> {
    try {
      await (
        this.docker as unknown as { createNetwork: (opts: unknown) => Promise<unknown> }
      ).createNetwork({
        Attachable: options.attachable,
        CheckDuplicate: options.checkDuplicate ?? true,
        Driver: options.driver ?? "overlay",
        EnableIPv6: options.enableIPv6,
        Ingress: options.ingress,
        Internal: options.internal,
        IPAM: options.ipam
          ? {
              Config: options.ipam.config?.map((c) => ({
                Gateway: c.gateway,
                IPRange: c.ipRange,
                Subnet: c.subnet,
              })),
              Driver: options.ipam.driver,
            }
          : undefined,
        Labels: options.labels,
        Name: options.name,
        Options: options.options,
      } as unknown)

      const networks = await this.list()
      const found = networks.find((n) => n.name === options.name)
      if (!found) throw new Error("Created network not found")
      return found
    } catch (error) {
      const message = (error as Error).message
      if (message.includes("already exists")) {
        throw new SwarmError(
          SwarmErrorCode.NETWORK_NAME_CONFLICT,
          `Network '${options.name}' already exists`
        )
      }
      throw error
    }
  }

  async remove(networkId: string): Promise<void> {
    try {
      await this.docker.getNetwork(networkId).remove()
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      const message = (error as Error).message
      if (message.includes("has active endpoints")) {
        throw new SwarmError(SwarmErrorCode.NETWORK_IN_USE, `Network ${networkId} is in use`)
      }
      throw error
    }
  }

  async getByName(name: string): Promise<SwarmNetworkInfo | undefined> {
    const networks = await this.docker.listNetworks({
      filters: JSON.stringify({ name: [name] }),
    } as unknown)
    const network = (networks as unknown[])[0]
    return network ? this.mapNetworkInfo(network as Record<string, unknown>) : undefined
  }

  async createOverlay(
    name: string,
    options: Partial<SwarmNetworkCreateOptions> = {}
  ): Promise<SwarmNetworkInfo> {
    return this.create({ attachable: true, driver: "overlay", name, ...options })
  }

  async connect(
    networkId: string,
    containerId: string,
    options?: { aliases?: string[]; ip?: string }
  ): Promise<void> {
    try {
      await this.docker.getNetwork(networkId).connect({
        Container: containerId,
        EndpointConfig: {
          Aliases: options?.aliases,
          IPAMConfig: options?.ip ? { IPv4Address: options.ip } : undefined,
        },
      } as unknown)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      throw error
    }
  }

  async disconnect(networkId: string, containerId: string, force = false): Promise<void> {
    try {
      await this.docker.getNetwork(networkId).disconnect({
        Container: containerId,
        Force: force,
      } as unknown)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NETWORK_NOT_FOUND, `Network ${networkId} not found`)
      }
      throw error
    }
  }

  private mapNetworkInfo(network: Record<string, unknown>): SwarmNetworkInfo {
    const ipam = network.IPAM as Record<string, unknown> | undefined
    const ipamConfig = ipam?.Config as Array<Record<string, unknown>> | undefined

    return {
      attachable: network.Attachable as boolean | undefined,
      created: (network.Created as string) ?? "",
      driver: (network.Driver as SwarmNetworkInfo["driver"]) ?? "bridge",
      enableIPv6: network.EnableIPv6 as boolean | undefined,
      id: (network.Id as string) ?? (network.ID as string) ?? "",
      ingress: network.Ingress as boolean | undefined,
      internal: network.Internal as boolean | undefined,
      ipam: ipam
        ? {
            config: ipamConfig?.map((c) => ({
              gateway: c.Gateway as string | undefined,
              ipRange: c.IPRange as string | undefined,
              subnet: c.Subnet as string | undefined,
            })),
            driver: ipam.Driver as string | undefined,
            options: ipam.Options as Record<string, string> | undefined,
          }
        : undefined,
      labels: network.Labels as Record<string, string> | undefined,
      name: (network.Name as string) ?? "",
      options: network.Options as Record<string, string> | undefined,
      scope: (network.Scope as "local" | "swarm") ?? "local",
    }
  }
}

export * from "./types"
