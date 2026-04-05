import type { Docker } from "@dockstat/docker"
import type Logger from "@dockstat/logger"
import type { DATABASE } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import { proxyEvent } from "../../../../events/workerEventProxy"
import { withRetry } from "../../../../utils/retry"
import type { ExtendedContainerStats } from "../../../mixins/containers/index.ts"

class ContainerMetricsMonitor {
  private intervalId?: ReturnType<typeof setInterval>
  private logger: Logger
  private dockerInstances: Map<number, Docker>
  private hosts: DATABASE.DB_target_host[]
  private clientId: number
  private options: {
    interval: number
    retryAttempts: number
    retryDelay: number
  }

  constructor(
    clientId: number,
    baseLogger: Logger,
    dockerInstances: Map<number, Docker>,
    hosts: DATABASE.DB_target_host[],
    options: {
      interval: number
      retryAttempts: number
      retryDelay: number
    }
  ) {
    this.clientId = clientId
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
      proxyEvent("error", error, {
        message: "Initial Container metrics monitoring failed!",
      })
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

  updateDockerInstances(instances: Map<number, Docker>): void {
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
      () => docker.containers.list({ all: false }), // Only running containers have stats
      this.options.retryAttempts,
      this.options.retryDelay
    )

    this.logger.debug(`Found ${containers.length} running containers on host ${hostId}`)

    // Collect stats for each container
    const statsPromises = containers.map(async (containerInfo) => {
      try {
        const stats = await retry(
          () =>
            docker.containers.stats(containerInfo.Id, {
              stream: false,
            }) as Promise<ExtendedContainerStats>,
          {
            attempts: this.options.retryAttempts,
            delay: this.options.retryDelay,
          }
        )

        // Extend with hostId and client info
        const extendedStats: ExtendedContainerStats = {
          ...stats,
          clientId: this.clientId,
          containerId: containerInfo.Id || "",
          containerName: containerInfo.Names?.[0]?.replace(/^\//, "") || "unknown",
          hostId,
        }

        // Calculate derived metrics
        const cpuUsage = this.calculateCpuUsage(extendedStats)
        const memoryUsage = extendedStats.memory_stats?.usage || 0
        const memoryLimit = extendedStats.memory_stats?.limit || 0
        const { rx: networkRx, tx: networkTx } = this.calculateNetworkIO(extendedStats)
        const { read: blockRead, write: blockWrite } = this.calculateBlockIO(extendedStats)

        proxyEvent("container:metrics", {
          containerId: containerInfo.Id,
          docker_client_id: host.docker_client_id,
          hostId,
          stats: {
            ...extendedStats,
            blockRead,
            blockWrite,
            cpuUsage: Math.round(cpuUsage * 100) / 100,
            memoryLimit,
            memoryUsage,
            networkRx,
            networkTx,
          },
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

  private calculateCpuUsage(stats: ExtendedContainerStats): number {
    const { cpu_stats, precpu_stats } = stats

    const cpuTotal = cpu_stats?.cpu_usage?.total_usage
    const preCpuTotal = precpu_stats?.cpu_usage?.total_usage

    if (cpuTotal == null || preCpuTotal == null) {
      return 0
    }

    const cpuDelta = cpuTotal - preCpuTotal
    const systemCpuDelta =
      (cpu_stats?.system_cpu_usage ?? 0) - (precpu_stats?.system_cpu_usage ?? 0)

    // Validate calculation prerequisites
    if (systemCpuDelta <= 0 || cpuDelta <= 0) {
      return 0
    }

    const cpuCount = cpu_stats?.online_cpus ?? cpu_stats?.cpu_usage?.percpu_usage?.length ?? 1

    return (cpuDelta / systemCpuDelta) * cpuCount * 100
  }

  private calculateNetworkIO(stats: ExtendedContainerStats): {
    rx: number
    tx: number
  } {
    let rx = 0
    let tx = 0

    if (stats.networks) {
      for (const network of Object.values(stats.)) {
        rx += network. || 0
        tx += network.tx_bytes || 0
      }
    }

    return { rx, tx }
  }

  private calculateBlockIO(stats: ExtendedContainerStats): {
    read: number
    write: number
  } {
    let read = 0
    let write = 0

    if (stats.blkio_stats?.io_service_bytes_recursive) {
      for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
        if (entry === null) continue
        if (entry.op === "read" || entry.op === "Read") {
          if (entry.value !== undefined) read += entry.value
        } else if (entry.op === "write" || entry.op === "Write") {
          if (entry.value !== undefined) write += entry.value
        }
      }
    }

    return { read, write }
  }
}

export default ContainerMetricsMonitor
