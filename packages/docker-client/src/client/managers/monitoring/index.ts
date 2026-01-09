import type Logger from "@dockstat/logger"
import type { DATABASE, DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import DockerEventStreamManager from "./eventStreamMonitor"
import ContainerEventMonitor from "./monitors/ContainerEvents"
import ContainerMetricsMonitor from "./monitors/ContainerMetrics"
import HealthCheckMonitor from "./monitors/HealthCheck"
import HostMetricsMonitor from "./monitors/HostMetrics"

export default class MonitoringManager {
  private logger: Logger
  private options: Required<DOCKER.MonitoringOptions>
  private isMonitoring = false

  private healthCheckMonitor: HealthCheckMonitor
  private containerEventMonitor: ContainerEventMonitor
  private hostMetricsMonitor: HostMetricsMonitor
  private containerMetricsMonitor: ContainerMetricsMonitor
  private dockerEventStreamManager: DockerEventStreamManager
  private dockerInstances: Map<number, Dockerode>
  private hosts: DATABASE.DB_target_host[]

  constructor(
    baseLogger: Logger,
    dockerInstances: Map<number, Dockerode>,
    hosts: DATABASE.DB_target_host[],
    options: DOCKER.MonitoringOptions = {}
  ) {
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.logger = baseLogger.spawn("MM")

    this.options = {
      healthCheckInterval: options.healthCheckInterval ?? 30000,
      containerEventPollingInterval: options.containerEventPollingInterval ?? 5000,
      hostMetricsInterval: options.hostMetricsInterval ?? 10000,
      containerMetricsInterval: options.containerMetricsInterval ?? 10000,
      enableContainerMetrics: options.enableContainerMetrics ?? true,
      enableContainerEvents: options.enableContainerEvents ?? true,
      enableHostMetrics: options.enableHostMetrics ?? true,
      enableHealthChecks: options.enableHealthChecks ?? true,
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 1000,
    }

    const retryOpts = {
      retryAttempts: this.options.retryAttempts,
      retryDelay: this.options.retryDelay,
    }

    this.healthCheckMonitor = new HealthCheckMonitor(
      this.logger,
      this.dockerInstances,
      this.hosts,
      {
        interval: this.options.healthCheckInterval,
        ...retryOpts,
      }
    )

    this.containerEventMonitor = new ContainerEventMonitor(
      this.logger,
      this.dockerInstances,
      this.hosts,
      {
        interval: this.options.containerEventPollingInterval,
        ...retryOpts,
      }
    )

    this.hostMetricsMonitor = new HostMetricsMonitor(
      this.logger,
      this.dockerInstances,
      this.hosts,
      {
        interval: this.options.hostMetricsInterval,
        ...retryOpts,
      }
    )

    this.containerMetricsMonitor = new ContainerMetricsMonitor(
      this.logger,
      this.dockerInstances,
      this.hosts,
      {
        interval: this.options.containerMetricsInterval,
        ...retryOpts,
      }
    )

    this.dockerEventStreamManager = new DockerEventStreamManager(
      this.logger,
      this.dockerInstances,
      this.hosts,
      retryOpts
    )

    this.logger.info("Initialized MonitoringManager")
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      this.logger.info("Monitoring is already running")
      return
    }

    this.isMonitoring = true
    this.logger.info("Starting monitoring services")

    if (this.options.enableHealthChecks) {
      this.logger.debug("Starting Health Check monitor")
      this.healthCheckMonitor.start()
    }
    if (this.options.enableContainerEvents) {
      this.logger.debug("Starting Container Events monitor")
      this.containerEventMonitor.start()
    }
    if (this.options.enableHostMetrics) {
      this.logger.debug("Starting Host Metrics Monitor")
      this.hostMetricsMonitor.start()
    }
    if (this.options.enableContainerMetrics) {
      this.logger.debug("Starting Container Metrics Monitor")
      this.containerMetricsMonitor.start()
    }

    this.dockerEventStreamManager.start()
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      this.logger.warn("Monitoring is not running")
      return
    }

    this.isMonitoring = false
    this.logger.info("Stopping monitoring services")

    this.healthCheckMonitor.stop()
    this.containerEventMonitor.stop()
    this.hostMetricsMonitor.stop()
    this.containerMetricsMonitor.stop()
    this.dockerEventStreamManager.stop()
  }

  public updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts
    this.healthCheckMonitor.updateHosts(hosts)
    this.containerEventMonitor.updateHosts(hosts)
    this.hostMetricsMonitor.updateHosts(hosts)
    this.containerMetricsMonitor.updateHosts(hosts)
    this.dockerEventStreamManager.updateHosts(hosts)

    if (this.isMonitoring) {
      this.dockerEventStreamManager.restart()
    }
  }

  public updateDockerInstances(instances: Map<number, Dockerode>): void {
    this.dockerInstances = instances
    this.healthCheckMonitor.updateDockerInstances(instances)
    this.containerEventMonitor.updateDockerInstances(instances)
    this.hostMetricsMonitor.updateDockerInstances(instances)
    this.containerMetricsMonitor.updateDockerInstances(instances)
    this.dockerEventStreamManager.updateDockerInstances(instances)

    if (this.isMonitoring) {
      this.dockerEventStreamManager.restart()
    }
  }

  public getMonitoringState(): {
    isMonitoring: boolean
    lastHealthStatus: Map<number, boolean>
    lastContainerStates: Map<string, DOCKER.ContainerInfo[]>
    dockerEventStreams: Map<number, NodeJS.ReadableStream>
  } {
    return {
      isMonitoring: this.isMonitoring,
      lastHealthStatus: this.healthCheckMonitor.getLastHealthStatus(),
      lastContainerStates: this.containerEventMonitor.getLastContainerStates(),
      dockerEventStreams: this.dockerEventStreamManager.getStreams(),
    }
  }

  public async getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics> {
    const docker = this.dockerInstances.get(hostId)
    const host = this.hosts.find((h) => Number(h.id) === hostId)

    if (!docker || !host) {
      throw new Error(`Docker instance or host not found for ID ${hostId}`)
    }

    const [info, version] = await Promise.all([docker.info(), docker.version()])

    return {
      hostId,
      hostName: host.name,
      dockerVersion: version.Version,
      apiVersion: version.ApiVersion,
      os: info.OperatingSystem,
      architecture: info.Architecture,
      totalMemory: info.MemTotal,
      totalCPU: info.NCPU,
      kernelVersion: info.KernelVersion,
      containers: info.Containers,
      containersRunning: info.ContainersRunning,
      containersStopped: info.ContainersStopped,
      containersPaused: info.ContainersPaused,
      images: info.Images,
      systemTime: info.SystemTime,
    }
  }

  public async getAllHostMetrics(): Promise<DOCKER.HostMetrics[]> {
    const results = await Promise.allSettled(
      this.hosts.map((h) => this.getHostMetrics(Number(h.id ?? 0)))
    )

    const successful: DOCKER.HostMetrics[] = []
    for (const r of results) {
      if (r.status === "fulfilled") successful.push(r.value)
      else this.logger.warn(`getAllHostMetrics failed for one host: ${String(r.reason)}`)
    }
    return successful
  }

  public async checkHostHealth(hostId: number): Promise<boolean> {
    try {
      const docker = this.dockerInstances.get(hostId)
      if (!docker) return false
      await docker.ping()
      return true
    } catch {
      return false
    }
  }

  public async checkAllHostsHealth(): Promise<Record<number, boolean>> {
    const entries = await Promise.all(
      this.hosts.map(async (h) => {
        const id = Number(h.id ?? 0)
        const healthy = await this.checkHostHealth(id)
        return [id, healthy] as const
      })
    )
    return Object.fromEntries(entries)
  }

  public async getAllStats(): Promise<DOCKER.AllStatsResponse> {
    // Aggregate host metrics and (optionally) container stats in future.
    // For now, return host metrics and leave container part to be expanded as needed.
    const hostMetrics = await this.getAllHostMetrics()
    return { hostMetrics } as unknown as DOCKER.AllStatsResponse
  }
}
