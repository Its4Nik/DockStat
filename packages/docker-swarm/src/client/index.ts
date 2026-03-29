/**
 * SwarmClient - Main client for Docker Swarm operations
 *
 * Provides a unified interface for all Docker Swarm operations.
 */

import { Logger } from "@dockstat/logger"
import Docker from "dockerode"
import { ConfigsModule } from "../modules/configs"
import { NetworksModule } from "../modules/networks"
import { NodesModule } from "../modules/nodes"
import { SecretsModule } from "../modules/secrets"
import { ServicesModule } from "../modules/services"
import { StacksModule } from "../modules/stacks"
import { SwarmModule } from "../modules/swarm"
import { TasksModule } from "../modules/tasks"
import type { DockerConnectionOptions, SwarmClientOptions } from "../types"

export type { SwarmClientOptions }

/**
 * SwarmClient
 *
 * Main client class for Docker Swarm operations.
 * Provides access to all modules through a single interface.
 */
export class SwarmClient {
  /** Docker instance */
  readonly docker: Docker

  /** Swarm cluster operations */
  readonly swarm: SwarmModule

  /** Node management */
  readonly nodes: NodesModule

  /** Service operations */
  readonly services: ServicesModule

  /** Task monitoring */
  readonly tasks: TasksModule

  /** Stack deployment and management */
  readonly stacks: StacksModule

  /** Secret management */
  readonly secrets: SecretsModule

  /** Config management */
  readonly configs: ConfigsModule

  /** Network operations */
  readonly networks: NetworksModule

  /** Logger instance */
  readonly logger: Logger

  /** Client options */
  readonly options: SwarmClientOptions

  constructor(options: SwarmClientOptions = {}) {
    this.options = options

    // Initialize logger with optional parent logger
    const parentLogger = options.logger
    this.logger = parentLogger?.spawn("docker-swarm") ?? new Logger("docker-swarm")

    // Set debug mode if enabled
    if (options.debug) {
      this.logger.setDisabled(false)
    }

    // Initialize Docker instance
    const socketPath = options.socketPath ?? "/var/run/docker.sock"
    const host = options.host

    this.docker = new Docker({
      socketPath: host ? undefined : socketPath,
      host: host ? new URL(host).hostname : undefined,
      port: host ? new URL(host).port : undefined,
      protocol: host ? (new URL(host).protocol.replace(":", "") as "http" | "https") : undefined,
      timeout: options.timeout ?? 30000,
      ca: options.tls?.ca as Buffer | undefined,
      cert: options.tls?.cert as Buffer | undefined,
      key: options.tls?.key as Buffer | undefined,
      sshOptions: options.ssh
        ? {
            host: options.ssh.host,
            port: options.ssh.port ?? 22,
            username: options.ssh.username,
            privateKey: options.ssh.privateKey as Buffer | undefined,
            passphrase: options.ssh.passphrase,
          }
        : undefined,
    } as Docker.DockerOptions)

    // Initialize modules with logger chaining
    const connOptions: DockerConnectionOptions = options
    this.swarm = new SwarmModule(connOptions, this.logger.spawn("swarm"))
    this.nodes = new NodesModule(connOptions, this.logger.spawn("nodes"))
    this.services = new ServicesModule(connOptions, this.logger.spawn("services"))
    this.tasks = new TasksModule(connOptions, this.logger.spawn("tasks"))
    this.stacks = new StacksModule(connOptions, this.logger.spawn("stacks"))
    this.secrets = new SecretsModule(connOptions, this.logger.spawn("secrets"))
    this.configs = new ConfigsModule(connOptions, this.logger.spawn("configs"))
    this.networks = new NetworksModule(connOptions, this.logger.spawn("networks"))
  }

  /**
   * Check if Docker is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.docker.ping()
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if this node is part of a swarm
   */
  async isSwarmNode(): Promise<boolean> {
    const status = await this.swarm.getStatus()
    return !!status.nodeID
  }

  /**
   * Check if this node is a swarm manager
   */
  async isSwarmManager(): Promise<boolean> {
    const status = await this.swarm.getStatus()
    return status.isManager ?? false
  }

  /**
   * Quick health check of the swarm cluster
   */
  async healthCheck(): Promise<{
    connected: boolean
    inSwarm: boolean
    isManager: boolean
    nodeCount?: number
    serviceCount?: number
  }> {
    try {
      const status = await this.swarm.getStatus()
      const inSwarm = !!status.nodeID

      let nodeCount: number | undefined
      let serviceCount: number | undefined

      if (inSwarm && status.isManager) {
        const [nodes, services] = await Promise.all([this.nodes.list(), this.services.list()])
        nodeCount = nodes.length
        serviceCount = services.length
      }

      return {
        connected: true,
        inSwarm,
        isManager: status.isManager ?? false,
        nodeCount,
        serviceCount,
      }
    } catch {
      return {
        connected: false,
        inSwarm: false,
        isManager: false,
      }
    }
  }

  /**
   * Get Docker version information
   */
  async version(): Promise<{
    version: string
    apiVersion: string
    gitCommit: string
    goVersion: string
    os: string
    arch: string
  }> {
    const version = await this.docker.version()
    return {
      version: version.Version ?? "",
      apiVersion: version.ApiVersion ?? "",
      gitCommit: version.GitCommit ?? "",
      goVersion: version.GoVersion ?? "",
      os: version.Os ?? "",
      arch: version.Arch ?? "",
    }
  }

  /**
   * Get Docker system information
   */
  async info(): Promise<Record<string, unknown>> {
    const info = await this.docker.info()
    return info as unknown as Record<string, unknown>
  }
}

export { Logger } from "@dockstat/logger"
