import Logger from "@dockstat/logger"
import type DB from "@dockstat/sqlite-wrapper"
import type { DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import HostHandler from "./managers/host-handler"
import MonitoringManager from "./managers/monitoring"
import StreamManager from "./managers/stream"

export class BaseDockerClient {
  public name: string
  public logger: Logger
  public hostHandler: HostHandler
  public dockerInstances: Map<number, Dockerode> = new Map()
  public activeStreams: Map<string, NodeJS.Timeout> = new Map()
  public options: Required<DOCKER.DockerAdapterOptions>
  public monitoringManager?: MonitoringManager
  public streamManager?: StreamManager
  public disposed = false
  public startTime = Date.now()

  constructor(
    id: number,
    name: string,
    DB: DB,
    options: DOCKER.DockerAdapterOptions = {},
    logger: Logger
  ) {
    this.logger = logger
    this.logger.info("Initializing DockerClient")
    this.hostHandler = new HostHandler(id, DB)
    this.options = {
      defaultTimeout: options.defaultTimeout ?? 5000,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      enableMonitoring: options.enableMonitoring ?? true,
      enableEventEmitter: options.enableEventEmitter ?? true,
      monitoringOptions: options.monitoringOptions ?? {},
      execOptions: options.execOptions ?? {},
    }

    this.name = name

    this.options.monitoringOptions = {
      containerEventPollingInterval:
        this.options.monitoringOptions?.containerEventPollingInterval || 30000,
      enableContainerMetrics: this.options.monitoringOptions?.enableContainerMetrics || false,
      containerMetricsInterval: this.options.monitoringOptions?.containerMetricsInterval || 60000,
      enableContainerEvents: this.options.monitoringOptions?.enableContainerEvents || false,
      enableHealthChecks: this.options.monitoringOptions?.enableHealthChecks ?? true,
      enableHostMetrics: this.options.monitoringOptions?.enableHostMetrics ?? false,
      healthCheckInterval: this.options.monitoringOptions?.healthCheckInterval ?? 60000,
      hostMetricsInterval: this.options.monitoringOptions?.hostMetricsInterval ?? 60000,
      retryAttempts: this.options.monitoringOptions?.retryAttempts ?? 3,
      retryDelay: this.options.monitoringOptions?.retryDelay ?? 1000,
    }

    this.logger.debug(
      `enableMonitoring=${this.options.enableMonitoring} enableContainerMetrics=${this.options.monitoringOptions?.enableContainerMetrics} enableHostMetrics=${this.options.monitoringOptions.enableHostMetrics}`
    )
    if (this.options.enableMonitoring) {
      this.monitoringManager = new MonitoringManager(
        this.logger,
        this.dockerInstances,
        this.hostHandler.getHosts()
      )
    }

    this.streamManager = new StreamManager(this, this.logger)
  }
}
