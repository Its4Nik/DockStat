/**
 * Nodes Module
 *
 * Provides operations for Docker Swarm node management.
 */

import Docker from "dockerode"
import type {
  DockerConnectionOptions,
  NodeInfo,
  NodeListFilters,
  NodeUpdateOptions,
} from "../../types"
import { SwarmError, SwarmErrorCode } from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"
import type { SwarmLogger } from "../../utils/logger"

/**
 * Nodes Module
 *
 * Manages Docker Swarm node operations.
 */
export class NodesModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions, _logger: SwarmLogger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
  }

  /**
   * List all nodes in the swarm
   */
  async list(filters?: NodeListFilters): Promise<NodeInfo[]> {
    const listFilters: Record<string, string[]> = {}

    if (filters) {
      if (filters.id) {
        listFilters.id = Array.isArray(filters.id) ? filters.id : [filters.id]
      }
      if (filters.name) {
        listFilters.name = Array.isArray(filters.name) ? filters.name : [filters.name]
      }
      if (filters.role) {
        listFilters.role = Array.isArray(filters.role) ? filters.role.map((r) => r) : [filters.role]
      }
      if (filters.membership) {
        listFilters.membership = [filters.membership]
      }
    }

    const nodes = await this.docker.listNodes({
      filters: Object.keys(listFilters).length > 0 ? JSON.stringify(listFilters) : undefined,
    } as unknown)

    return (nodes as unknown[]).map((node) => this.mapNodeInfo(node as Record<string, unknown>))
  }

  /**
   * Get a specific node by ID
   */
  async get(nodeId: string): Promise<NodeInfo> {
    try {
      const node = await this.docker.getNode(nodeId).inspect()
      return this.mapNodeInfo(node as unknown as Record<string, unknown>)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NODE_NOT_FOUND, `Node ${nodeId} not found`)
      }
      throw error
    }
  }

  /**
   * Update node configuration
   */
  async update(nodeId: string, options: NodeUpdateOptions): Promise<void> {
    try {
      const node = this.docker.getNode(nodeId)
      const current = (await node.inspect()) as unknown as Record<string, unknown>
      const currentSpec = current.Spec as Record<string, unknown> | undefined
      const version = ((current.Version as Record<string, unknown>)?.Index as number) ?? 0

      const spec = {
        ...currentSpec,
        Name: options.name ?? currentSpec?.Name,
        Labels: options.labels ?? currentSpec?.Labels,
        Role: options.role ?? currentSpec?.Role,
        Availability: options.availability ?? currentSpec?.Availability,
      }

      await (
        node as unknown as { update: (spec: unknown, version: unknown) => Promise<void> }
      ).update(spec, version)
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NODE_NOT_FOUND, `Node ${nodeId} not found`)
      }
      throw new SwarmError(
        SwarmErrorCode.NODE_UPDATE_FAILED,
        `Failed to update node ${nodeId}: ${(error as Error).message}`
      )
    }
  }

  /**
   * Remove a node from the swarm
   */
  async remove(nodeId: string, force = false): Promise<void> {
    try {
      const node = this.docker.getNode(nodeId)
      await node.remove({ force })
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        throw new SwarmError(SwarmErrorCode.NODE_NOT_FOUND, `Node ${nodeId} not found`)
      }
      throw new SwarmError(
        SwarmErrorCode.NODE_REMOVE_FAILED,
        `Failed to remove node ${nodeId}: ${(error as Error).message}`
      )
    }
  }

  /**
   * Set node availability
   */
  async setAvailability(nodeId: string, availability: "active" | "pause" | "drain"): Promise<void> {
    await this.update(nodeId, { availability })
  }

  /**
   * Get node by name
   */
  async getByName(name: string): Promise<NodeInfo | undefined> {
    const nodes = await this.list({ name })
    return nodes[0]
  }

  /**
   * Add label to a node
   */
  async addLabel(nodeId: string, key: string, value: string): Promise<void> {
    const node = await this.get(nodeId)
    const labels = {
      ...(node.spec.labels ?? {}),
      [key]: value,
    }
    await this.update(nodeId, { labels })
  }

  /**
   * Remove label from a node
   */
  async removeLabel(nodeId: string, key: string): Promise<void> {
    const node = await this.get(nodeId)
    const labels = { ...(node.spec.labels ?? {}) }
    delete labels[key]
    await this.update(nodeId, { labels })
  }

  /**
   * Map Docker node response to NodeInfo
   */
  private mapNodeInfo(node: Record<string, unknown>): NodeInfo {
    const spec = node.Spec as Record<string, unknown> | undefined
    const description = node.Description as Record<string, unknown> | undefined
    const status = node.Status as Record<string, unknown> | undefined
    const managerStatus = node.ManagerStatus as Record<string, unknown> | undefined
    const version = node.Version as Record<string, unknown> | undefined

    return {
      id: (node.ID as string) ?? "",
      version: {
        index: (version?.Index as number) ?? 0,
      },
      createdAt: (node.CreatedAt as string) ?? "",
      updatedAt: (node.UpdatedAt as string) ?? "",
      spec: {
        name: spec?.Name as string | undefined,
        labels: spec?.Labels as Record<string, string> | undefined,
        role: spec?.Role as "worker" | "manager" | undefined,
        availability: spec?.Availability as "active" | "pause" | "drain" | undefined,
      },
      description: description
        ? {
            hostname: description.Hostname as string | undefined,
            platform: description.Platform
              ? {
                  architecture: (description.Platform as Record<string, unknown>).Architecture as
                    | string
                    | undefined,
                  os: (description.Platform as Record<string, unknown>).OS as string | undefined,
                }
              : undefined,
            resources: description.Resources
              ? {
                  nanoCPUs: (description.Resources as Record<string, unknown>).NanoCPUs as
                    | number
                    | undefined,
                  memoryBytes: (description.Resources as Record<string, unknown>).MemoryBytes as
                    | number
                    | undefined,
                }
              : undefined,
            engine: description.Engine
              ? {
                  engineVersion: (description.Engine as Record<string, unknown>).EngineVersion as
                    | string
                    | undefined,
                  labels: (description.Engine as Record<string, unknown>).Labels as
                    | Record<string, string>
                    | undefined,
                  plugins: Array.isArray((description.Engine as Record<string, unknown>).Plugins)
                    ? (
                        (description.Engine as Record<string, unknown>).Plugins as Array<
                          Record<string, unknown>
                        >
                      ).map((p) => ({
                        type: (p.Type as string) ?? "",
                        name: (p.Name as string) ?? "",
                      }))
                    : undefined,
                }
              : undefined,
          }
        : undefined,
      status: {
        state: (status?.State as "unknown" | "down" | "ready" | "disconnected") ?? "unknown",
        message: status?.Message as string | undefined,
        addr: status?.Addr as string | undefined,
      },
      managerStatus: managerStatus
        ? {
            leader: managerStatus.Leader as boolean | undefined,
            reachability: managerStatus.Reachability as
              | "unknown"
              | "unreachable"
              | "reachable"
              | undefined,
            addr: managerStatus.Addr as string | undefined,
          }
        : undefined,
    }
  }
}

export * from "./types"
