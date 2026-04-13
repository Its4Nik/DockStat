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
          isManager: false,
          nodeID: undefined,
        }
      }

      const swarm = await this.docker.swarmInspect()

      return {
        createdAt: swarm.CreatedAt,
        id: swarm.ID,
        isManager: info.Swarm.ControlAvailable ?? false,
        joinTokens: swarm.JoinTokens,
        nodeAddr: info.Swarm.NodeAddr,
        nodeID: info.Swarm.NodeID,
        spec: swarm.Spec as unknown as SwarmStatus["spec"],
        updatedAt: swarm.UpdatedAt,
        version: swarm.Version ? { index: swarm.Version.Index ?? 0 } : undefined,
      }
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 503) {
        return {
          isManager: false,
          nodeID: undefined,
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
      ForceNewCluster: options.forceNewCluster,
      ListenAddr: options.listenAddr ?? "0.0.0.0:2377",
      Spec: options.spec as unknown,
    } as unknown)

    const swarm = await this.docker.swarmInspect()

    return {
      managerToken: swarm.JoinTokens?.Manager ?? "",
      workerToken: swarm.JoinTokens?.Worker ?? "",
    }
  }

  /**
   * Join an existing Docker Swarm
   */
  async join(options: SwarmJoinOptions): Promise<void> {
    await this.docker.swarmJoin({
      AdvertiseAddr: options.advertiseAddr,
      JoinToken: options.joinToken,
      ListenAddr: options.listenAddr ?? "0.0.0.0:2377",
      RemoteAddrs: options.remoteAddrs,
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
      rotateManagerToken: options.rotateManagerToken,
      rotateWorkerToken: options.rotateWorkerToken,
      spec: options.spec,
      version: options.version,
    })
  }

  /**
   * Get join tokens for the swarm
   */
  async getJoinTokens(): Promise<{ worker: string; manager: string }> {
    const swarm = await this.docker.swarmInspect()

    return {
      manager: swarm.JoinTokens?.Manager ?? "",
      worker: swarm.JoinTokens?.Worker ?? "",
    }
  }

  /**
   * Rotate join tokens
   */
  async rotateJoinTokens(): Promise<{ worker: string; manager: string }> {
    const swarm = await this.docker.swarmInspect()
    const version = swarm.Version?.Index ?? 0

    await this.update({
      rotateManagerToken: true,
      rotateWorkerToken: true,
      spec: swarm.Spec ?? {},
      version,
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
