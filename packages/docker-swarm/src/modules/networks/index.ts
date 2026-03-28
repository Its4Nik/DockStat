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
  private logger: SwarmLogger

  constructor(options: DockerConnectionOptions, logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
    this.logger = logger
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
        Name: options.name,
        Driver: options.driver ?? "overlay",
        CheckDuplicate: options.checkDuplicate ?? true,
        Internal: options.internal,
        Attachable: options.attachable,
        Ingress: options.ingress,
        EnableIPv6: options.enableIPv6,
        Labels: options.labels,
        Options: options.options,
        IPAM: options.ipam
          ? {
              Driver: options.ipam.driver,
              Config: options.ipam.config?.map((c) => ({
                Subnet: c.subnet,
                IPRange: c.ipRange,
                Gateway: c.gateway,
              })),
            }
          : undefined,
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
    return this.create({ name, driver: "overlay", attachable: true, ...options })
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
      name: (network.Name as string) ?? "",
      id: (network.Id as string) ?? (network.ID as string) ?? "",
      created: (network.Created as string) ?? "",
      scope: (network.Scope as "local" | "swarm") ?? "local",
      driver: (network.Driver as SwarmNetworkInfo["driver"]) ?? "bridge",
      attachable: network.Attachable as boolean | undefined,
      ingress: network.Ingress as boolean | undefined,
      internal: network.Internal as boolean | undefined,
      enableIPv6: network.EnableIPv6 as boolean | undefined,
      ipam: ipam
        ? {
            driver: ipam.Driver as string | undefined,
            config: ipamConfig?.map((c) => ({
              subnet: c.Subnet as string | undefined,
              ipRange: c.IPRange as string | undefined,
              gateway: c.Gateway as string | undefined,
            })),
            options: ipam.Options as Record<string, string> | undefined,
          }
        : undefined,
      labels: network.Labels as Record<string, string> | undefined,
      options: network.Options as Record<string, string> | undefined,
    }
  }
}

export * from "./types"
