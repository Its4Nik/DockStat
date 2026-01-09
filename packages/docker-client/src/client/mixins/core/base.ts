import type Logger from "@dockstat/logger"
import type DB from "@dockstat/sqlite-wrapper"
import type { DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import HostHandler from "../../managers/host-handler"
import MonitoringManager from "../../managers/monitoring"
import StreamManager, { type StreamCapableClient } from "../../managers/stream"

/**
 * Base DockerClient class with core properties and constructor.
 * This class serves as the foundation for mixin-based composition.
 */
export class DockerClientBase {
  // Core properties
  public readonly id: number
  public name: string
  public logger: Logger
  public hostHandler: HostHandler
  public dockerInstances: Map<number, Dockerode> = new Map()
  public activeStreams: Map<string, NodeJS.Timeout> = new Map()
  public options: Required<DOCKER.DockerAdapterOptions>
  public disposed = false
  public readonly startTime: number

  // Managers (will be initialized by mixins)
  public monitoringManager?: MonitoringManager
  public streamManager?: StreamManager

  constructor(
    id: number,
    name: string,
    DB: DB,
    options: DOCKER.DockerAdapterOptions = {},
    logger: Logger
  ) {
    // Validate required parameters
    if (typeof id !== "number" || id < 0) {
      throw new Error(`Invalid client ID: ${id}. Must be a non-negative number.`)
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw new Error(`Invalid client name: "${name}". Must be a non-empty string.`)
    }

    if (!DB) {
      throw new Error("Database instance is required")
    }

    if (!logger) {
      throw new Error("Logger instance is required")
    }

    // Initialize core properties
    this.id = id
    this.name = name.trim()
    this.logger = logger
    this.startTime = Date.now()

    // Initialize host handler
    this.hostHandler = new HostHandler(id, DB)

    // Initialize and validate options
    this.options = this.initializeOptions(options)

    // Initialize optional managers
    if (this.options.enableMonitoring) {
      this.monitoringManager = new MonitoringManager(
        this.logger,
        this.dockerInstances,
        this.hostHandler.getHosts(),
        this.options.monitoringOptions
      )
    }
    this.streamManager = new StreamManager(this as unknown as StreamCapableClient, this.logger)

    this.logger.info(`DockerClient initialized: ${this.name} (ID: ${this.id})`)
    this.logger.debug(`Options: ${JSON.stringify(this.options)}`)
  }

  /**
   * Initialize and validate client options with defaults
   */
  private initializeOptions(
    options: DOCKER.DockerAdapterOptions
  ): Required<DOCKER.DockerAdapterOptions> {
    const baseOptions = {
      defaultTimeout: options.defaultTimeout ?? 5000,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      enableMonitoring: options.enableMonitoring ?? true,
      enableEventEmitter: options.enableEventEmitter ?? true,
      monitoringOptions: options.monitoringOptions ?? {},
      execOptions: options.execOptions ?? {},
    }

    // Validate timeout
    if (baseOptions.defaultTimeout < 1000) {
      this.logger.warn(
        `Default timeout ${baseOptions.defaultTimeout}ms is too low, setting to 1000ms`
      )
      baseOptions.defaultTimeout = 1000
    }

    // Validate retry attempts
    if (baseOptions.retryAttempts < 0) {
      this.logger.warn(`Retry attempts ${baseOptions.retryAttempts} is invalid, setting to 0`)
      baseOptions.retryAttempts = 0
    }

    // Validate retry delay
    if (baseOptions.retryDelay < 100) {
      this.logger.warn(`Retry delay ${baseOptions.retryDelay}ms is too low, setting to 100ms`)
      baseOptions.retryDelay = 100
    }

    // Initialize monitoring options with defaults
    baseOptions.monitoringOptions = {
      containerEventPollingInterval:
        options.monitoringOptions?.containerEventPollingInterval ?? 30000,
      enableContainerMetrics: options.monitoringOptions?.enableContainerMetrics ?? false,
      containerMetricsInterval: options.monitoringOptions?.containerMetricsInterval ?? 60000,
      enableContainerEvents: options.monitoringOptions?.enableContainerEvents ?? false,
      enableHealthChecks: options.monitoringOptions?.enableHealthChecks ?? true,
      enableHostMetrics: options.monitoringOptions?.enableHostMetrics ?? false,
      healthCheckInterval: options.monitoringOptions?.healthCheckInterval ?? 60000,
      hostMetricsInterval: options.monitoringOptions?.hostMetricsInterval ?? 60000,
      retryAttempts: options.monitoringOptions?.retryAttempts ?? 3,
      retryDelay: options.monitoringOptions?.retryDelay ?? 1000,
    }

    // Validate monitoring intervals
    if ((baseOptions.monitoringOptions.containerEventPollingInterval || 0) < 5000) {
      this.logger.warn(`Container event polling interval too low, setting to 5000ms`)
      baseOptions.monitoringOptions.containerEventPollingInterval = 5000
    }

    if ((baseOptions.monitoringOptions.containerMetricsInterval || 0) < 10000) {
      this.logger.warn(`Container metrics interval too low, setting to 10000ms`)
      baseOptions.monitoringOptions.containerMetricsInterval = 10000
    }

    if ((baseOptions.monitoringOptions.healthCheckInterval || 0) < 10000) {
      this.logger.warn(`Health check interval too low, setting to 10000ms`)
      baseOptions.monitoringOptions.healthCheckInterval = 10000
    }

    if ((baseOptions.monitoringOptions.hostMetricsInterval || 0) < 10000) {
      this.logger.warn(`Host metrics interval too low, setting to 10000ms`)
      baseOptions.monitoringOptions.hostMetricsInterval = 10000
    }

    return baseOptions
  }

  /**
   * Check if the client has been disposed
   * @throws {Error} If the client has been disposed
   */
  protected checkDisposed(): void {
    if (this.disposed) {
      throw new Error(`DockerClient ${this.name} (ID: ${this.id}) has been disposed`)
    }
  }

  /**
   * Get basic metrics about the client
   */
  public getMetrics() {
    return {
      id: this.id,
      name: this.name,
      hostsManaged: this.dockerInstances.size,
      activeStreams: this.activeStreams.size,
      uptime: Date.now() - this.startTime,
      disposed: this.disposed,
    }
  }

  /**
   * Dispose of the client and cleanup resources
   */
  public dispose(): void {
    if (this.disposed) {
      return
    }

    this.logger.info(`Disposing DockerClient ${this.name} (ID: ${this.id})`)

    // Stop all active streams
    this.activeStreams.forEach((timer, key) => {
      clearInterval(timer)
      this.logger.debug(`Stopped stream: ${key}`)
    })
    this.activeStreams.clear()

    // Clear docker instances
    this.dockerInstances.clear()

    this.disposed = true
    this.logger.info(`DockerClient ${this.name} (ID: ${this.id}) disposed`)
  }

  public getDockerInstance(hostId: number): Dockerode {
    this.checkDisposed()

    if (typeof hostId !== "number" || hostId < 0) {
      throw new Error(`Invalid host ID: ${hostId}. Must be a non-negative number.`)
    }

    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      const available = Array.from(this.dockerInstances.keys())
      throw new Error(
        `No Docker instance found for host ID ${hostId}. Available instances: [${available.join(", ")}]`
      )
    }
    return docker
  }
}
