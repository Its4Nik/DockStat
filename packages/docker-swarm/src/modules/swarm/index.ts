/**
 * Swarm Module
 *
 * Provides operations for Docker Swarm cluster management including
 * initialization, joining, leaving, and configuration.
 */

import type { Logger } from "@dockstat/logger"
import Docker from "dockerode"
import type {
  DockerConnectionOptions,
  SwarmInitOptions,
  SwarmJoinOptions,
  SwarmLeaveOptions,
  SwarmStatus,
  SwarmUpdateOptions,
} from "../../types"
import { buildConnectionConfig } from "../../utils/docker-socket"

/**
 * Swarm Module
 *
 * Manages Docker Swarm cluster operations.
 */
export class SwarmModule {
  private docker: Docker

  constructor(options: DockerConnectionOptions, logger: Logger) {
    const config = buildConnectionConfig(options)
    this.docker = new Docker(config as unknown as Docker.DockerOptions)
    this.logger = logger
  }

  /**
   * Get the current swarm status
   */
  async getStatus(): Promise<SwarmStatus> {
    try {
      const info = await this.docker.info()

      if (!info.Swarm?.NodeID) {
        return {
          nodeID: undefined,
          isManager: false,
        }
      }

      const swarm = await this.docker.swarmInspect()

      return {
        id: swarm.ID,
        version: swarm.Version ? { index: swarm.Version.Index ?? 0 } : undefined,
        createdAt: swarm.CreatedAt,
        updatedAt: swarm.UpdatedAt,
        spec: swarm.Spec as unknown as SwarmStatus["spec"],
        joinTokens: swarm.JoinTokens,
        nodeID: info.Swarm.NodeID,
        nodeAddr: info.Swarm.NodeAddr,
        isManager: info.Swarm.ControlAvailable ?? false,
      }
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 503) {
        return {
          nodeID: undefined,
          isManager: false,
        }
      }
      throw error
    }
  }

  /**
   * Initialize a new Docker Swarm
   */
  async init(
    options: SwarmInitOptions = {}
  ): Promise<{ workerToken: string; managerToken: string }> {
    await this.docker.swarmInit({
      AdvertiseAddr: options.advertiseAddr,
      ListenAddr: options.listenAddr ?? "0.0.0.0:2377",
      ForceNewCluster: options.forceNewCluster,
      Spec: options.spec as unknown,
    } as unknown)

    const swarm = await this.docker.swarmInspect()

    return {
      workerToken: swarm.JoinTokens?.Worker ?? "",
      managerToken: swarm.JoinTokens?.Manager ?? "",
    }
  }

  /**
   * Join an existing Docker Swarm
   */
  async join(options: SwarmJoinOptions): Promise<void> {
    await this.docker.swarmJoin({
      JoinToken: options.joinToken,
      RemoteAddrs: options.remoteAddrs,
      ListenAddr: options.listenAddr ?? "0.0.0.0:2377",
      AdvertiseAddr: options.advertiseAddr,
    } as unknown)
  }

  /**
   * Leave the Docker Swarm
   */
  async leave(options: SwarmLeaveOptions = {}): Promise<void> {
    await this.docker.swarmLeave({
      force: options.force ?? false,
    })
  }

  /**
   * Update swarm configuration
   */
  async update(options: SwarmUpdateOptions): Promise<void> {
    await (
      this.docker as unknown as Record<string, (opts: unknown, cb?: unknown) => Promise<void>>
    ).swarmUpdate({
      spec: options.spec,
      version: options.version,
      rotateWorkerToken: options.rotateWorkerToken,
      rotateManagerToken: options.rotateManagerToken,
    })
  }

  /**
   * Get join tokens for the swarm
   */
  async getJoinTokens(): Promise<{ worker: string; manager: string }> {
    const swarm = await this.docker.swarmInspect()

    return {
      worker: swarm.JoinTokens?.Worker ?? "",
      manager: swarm.JoinTokens?.Manager ?? "",
    }
  }

  /**
   * Rotate join tokens
   */
  async rotateJoinTokens(): Promise<{ worker: string; manager: string }> {
    const swarm = await this.docker.swarmInspect()
    const version = swarm.Version?.Index ?? 0

    await this.update({
      spec: swarm.Spec ?? {},
      version,
      rotateWorkerToken: true,
      rotateManagerToken: true,
    })

    return this.getJoinTokens()
  }

  /**
   * Check if this node is a swarm manager
   */
  async isManager(): Promise<boolean> {
    const status = await this.getStatus()
    return status.isManager ?? false
  }

  /**
   * Check if this node is part of a swarm
   */
  async isInSwarm(): Promise<boolean> {
    const status = await this.getStatus()
    return !!status.nodeID
  }
}

export * from "./types"
