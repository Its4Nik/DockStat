import type Logger from "@dockstat/logger"
import type { DATABASE, DOCKER } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import type Dockerode from "dockerode"
import { proxyEvent } from "../../../../events/workerEventProxy"
import { withRetry } from "../../../../utils/retry"
import { mapContainerInfo } from "../../../utils/mapContainerInfo"

class ContainerMetricsMonitor {
  private intervalId?: ReturnType<typeof setInterval>
  private logger: Logger
  private dockerInstances: Map<number, Dockerode>
  private hosts: DATABASE.DB_target_host[]
  private options: {
    interval: number
    retryAttempts: number
    retryDelay: number
  }

  constructor(
    baseLogger: Logger,
    dockerInstances: Map<number, Dockerode>,
    hosts: DATABASE.DB_target_host[],
    options: {
      interval: number
      retryAttempts: number
      retryDelay: number
    }
  ) {
    this.logger = baseLogger.spawn("CMM")
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.options = options
  }

  start(): void {
    this.logger.info(`Starting container metrics monitoring at interval ${this.options.interval}ms`)
    this.intervalId = setInterval(() => this.collectMetrics(), this.options.interval)
    this.collectMetrics().catch((error) => {
      this.logger.error(`Initial Container metrics monitoring failed! - ${error}`)
      proxyEvent("error", error, { message: "Initial Container metrics monitoring failed!" })
    })
  }

  stop(): void {
    if (this.intervalId) {
      this.logger.info("Stopping Container Metrics Monitoring")
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts
  }

  updateDockerInstances(instances: Map<number, Dockerode>): void {
    this.dockerInstances = instances
  }

  private async collectMetrics(): Promise<void> {
    this.logger.debug("Collecting Container Metrics")
    const promises = this.hosts.map(async (host) => {
      try {
        await this.collectMetricsForHost(host)
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: host.id,
          message: "Collecting Container metrics failed",
        })
      }
    })
    await Promise.allSettled(promises)
  }

  private async collectMetricsForHost(host: DATABASE.DB_target_host): Promise<void> {
    const hostId = host.id ?? 0
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      this.logger.error(`Docker instance not found for host ID ${hostId}`)
      throw new Error(`Docker instance not found for host ID ${hostId}`)
    }

    // Get all running containers for this host
    const containers = await withRetry(
      () => docker.listContainers({ all: false }), // Only running containers have stats
      this.options.retryAttempts,
      this.options.retryDelay
    )

    this.logger.debug(`Found ${containers.length} running containers on host ${hostId}`)

    // Collect stats for each container
    const statsPromises = containers.map(async (containerInfo) => {
      try {
        const container = docker.getContainer(containerInfo.Id)
        const stats = await retry(
          () => container.stats({ stream: false }) as Promise<Dockerode.ContainerStats>,
          { attempts: this.options.retryAttempts, delay: this.options.retryDelay }
        )

        const containerStatsInfo = this.mapContainerStats(containerInfo, stats, hostId)

        proxyEvent("container:metrics", {
          hostId,
          docker_client_id: host.docker_client_id,
          containerId: containerInfo.Id,
          stats: containerStatsInfo,
        })
      } catch (error) {
        this.logger.warn(
          `Failed to collect stats for container ${containerInfo.Id}: ${error instanceof Error ? error.message : String(error)}`
        )
        // Don't throw - continue collecting for other containers
      }
    })

    await Promise.allSettled(statsPromises)
  }

  private mapContainerStats(
    containerInfo: Dockerode.ContainerInfo,
    stats: Dockerode.ContainerStats,
    hostId: number
  ): DOCKER.ContainerStatsInfo {
    const baseInfo = mapContainerInfo(containerInfo, hostId)

    // Calculate CPU usage percentage
    const cpuUsage = this.calculateCpuUsage(stats)

    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage || 0
    const memoryLimit = stats.memory_stats.limit || 0

    // Calculate network I/O
    const { rx: networkRx, tx: networkTx } = this.calculateNetworkIO(stats)

    // Calculate block I/O
    const { read: blockRead, write: blockWrite } = this.calculateBlockIO(stats)

    return {
      ...baseInfo,
      stats,
      cpuUsage,
      memoryUsage,
      memoryLimit,
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
    }
  }

  private calculateCpuUsage(stats: Dockerode.ContainerStats): number {
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage
    const systemCpuDelta =
      (stats.cpu_stats.system_cpu_usage || 0) - (stats.precpu_stats.system_cpu_usage || 0)
    const cpuCount =
      stats.cpu_stats.online_cpus || stats.cpu_stats.cpu_usage.percpu_usage?.length || 1

    if (systemCpuDelta > 0 && cpuDelta > 0) {
      return (cpuDelta / systemCpuDelta) * cpuCount * 100
    }

    return 0
  }

  private calculateNetworkIO(stats: Dockerode.ContainerStats): { rx: number; tx: number } {
    let rx = 0
    let tx = 0

    if (stats.networks) {
      for (const network of Object.values(stats.networks)) {
        rx += network.rx_bytes || 0
        tx += network.tx_bytes || 0
      }
    }

    return { rx, tx }
  }

  private calculateBlockIO(stats: Dockerode.ContainerStats): { read: number; write: number } {
    let read = 0
    let write = 0

    if (stats.blkio_stats?.io_service_bytes_recursive) {
      for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
        if (entry.op === "read" || entry.op === "Read") {
          read += entry.value
        } else if (entry.op === "write" || entry.op === "Write") {
          write += entry.value
        }
      }
    }

    return { read, write }
  }
}

export default ContainerMetricsMonitor
