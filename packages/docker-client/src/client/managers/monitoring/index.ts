import type { Docker } from "@dockstat/docker"
import type Logger from "@dockstat/logger"
import type { DATABASE, DOCKER } from "@dockstat/typings"
import DockerEventStreamManager from "./eventStreamMonitor"
import ContainerEventMonitor from "./monitors/ContainerEvents"
import ContainerMetricsMonitor from "./monitors/ContainerMetrics"
import HealthCheckMonitor from "./monitors/HealthCheck"
import HostMetricsMonitor from "./monitors/HostMetrics"

export default class MonitoringManager {
  private logger: Logger
  private options: Required<DOCKER.MonitoringOptions>
  private isMonitoring = false
  private clientId: number

  private healthCheckMonitor: HealthCheckMonitor
  private containerEventMonitor: ContainerEventMonitor
  private hostMetricsMonitor: HostMetricsMonitor
  private containerMetricsMonitor: ContainerMetricsMonitor
  private dockerEventStreamManager: DockerEventStreamManager
  private dockerInstances: Map<number, Docker>
  private hosts: DATABASE.DB_target_host[]

  constructor(
    clientId: number,
    baseLogger: Logger,
    dockerInstances: Map<number, Docker>,
    hosts: DATABASE.DB_target_host[],
    options: DOCKER.MonitoringOptions = {}
  ) {
    this.clientId = clientId
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.logger = baseLogger.spawn("MM")

    this.options = {
      containerEventPollingInterval: options.containerEventPollingInterval ?? 5000,
      containerMetricsInterval: options.containerMetricsInterval ?? 10000,
      enableContainerEvents: options.enableContainerEvents ?? true,
      enableContainerMetrics: options.enableContainerMetrics ?? true,
      enableHealthChecks: options.enableHealthChecks ?? true,
      enableHostMetrics: options.enableHostMetrics ?? true,
      healthCheckInterval: options.healthCheckInterval ?? 30000,
      hostMetricsInterval: options.hostMetricsInterval ?? 10000,
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
      this.clientId,
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
      this.clientId,
      this.logger,
      this.dockerInstances,
      this.hosts,
      {
        interval: this.options.containerMetricsInterval,
        ...retryOpts,
      }
    )

    this.dockerEventStreamManager = new DockerEventStreamManager(
      this.clientId,
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

  public updateDockerInstances(instances: Map<number, Docker>): void {
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
      dockerEventStreams: this.dockerEventStreamManager.getStreams(),
      isMonitoring: this.isMonitoring,
      lastContainerStates: this.containerEventMonitor.getLastContainerStates(),
      lastHealthStatus: this.healthCheckMonitor.getLastHealthStatus(),
    }
  }

  public async getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics> {
    const docker = this.dockerInstances.get(hostId)
    const host = this.hosts.find((h) => Number(h.id) === hostId)

    if (!docker || !host) {
      throw new Error(`Docker instance or host not found for ID ${hostId}`)
    }

    const [info, version] = await Promise.all([docker.system.info(), docker.system.version()])

    return {
      apiVersion: version.ApiVersion,
      architecture: info.Architecture,
      containers: info.Containers,
      containersPaused: info.ContainersPaused,
      containersRunning: info.ContainersRunning,
      containersStopped: info.ContainersStopped,
      dockerVersion: version.Version,
      hostId,
      hostName: host.name,
      images: info.Images,
      kernelVersion: info.KernelVersion,
      os: info.OperatingSystem,
      systemTime: info.SystemTime,
      totalCPU: info.NCPU,
      totalMemory: info.MemTotal,
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
