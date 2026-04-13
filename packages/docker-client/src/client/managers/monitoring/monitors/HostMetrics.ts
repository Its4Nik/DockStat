import type { Docker } from "@dockstat/docker"
import type Logger from "@dockstat/logger"
import type { DATABASE } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import { proxyEvent } from "../../../../events/workerEventProxy"

class HostMetricsMonitor {
  private intervalId?: ReturnType<typeof setInterval>
  private logger: Logger
  private dockerInstances: Map<number, Docker>
  private hosts: DATABASE.DB_target_host[]
  private options: {
    interval: number
    retryAttempts: number
    retryDelay: number
  }

  constructor(
    baseLogger: Logger,
    dockerInstances: Map<number, Docker>,
    hosts: DATABASE.DB_target_host[],
    options: {
      interval: number
      retryAttempts: number
      retryDelay: number
    }
  ) {
    this.logger = baseLogger.spawn("HCM")
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.options = options
  }

  start(): void {
    this.logger.info(`Starting host metrics monitoring at interval ${this.options.interval}ms`)
    this.intervalId = setInterval(() => this.collectMetrics(), this.options.interval)
    this.collectMetrics().catch((error) => {
      this.logger.error(`Initial Host monitoring failed! - ${error}`)
      proxyEvent("error", error, { message: "Initial Host monitoring failed!" })
    })
  }

  stop(): void {
    if (this.intervalId) {
      this.logger.info("Stopping Host Metrics Monitoring")
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
    this.logger.debug("Collecting Host Metrics")
    const promises = this.hosts.map(async (host) => {
      try {
        const metrics = await this.getHostMetrics(host.id || 0)
        proxyEvent("host:metrics", {
          docker_client_id: host.docker_client_id,
          hostId: host.id || 0,
          hostName: host.name,
          metrics,
        })
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: host.id,
          message: "Collecting Host metrics failed",
        })
      }
    })
    await Promise.allSettled(promises)
  }

  private async getHostMetrics(hostId: number) {
    this.logger.debug(`Collecting Host Metrics for ${JSON.stringify({ hostId })}`)
    const docker = this.dockerInstances.get(hostId)
    const host = this.hosts.find((h) => h.id === hostId)

    if (!docker || !host) {
      this.logger.error(`Docker instance or host not found for ID ${hostId}`)
      throw new Error(`Docker instance or host not found for ID ${hostId}`)
    }

    const [info, version] = await Promise.all([
      retry(() => docker.system.info(), {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      }),
      retry(() => docker.system.version(), {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      }),
    ])

    this.logger.debug(`Collected Host Metrics for ${JSON.stringify({ hostId })}`)

    return {
      apiVersion: version.ApiVersion || "unknown",
      architecture: info.Architecture || "unknown",
      containers: info.Containers || 0,
      containersPaused: info.ContainersPaused || 0,
      containersRunning: info.ContainersRunning || 0,
      containersStopped: info.ContainersStopped || 0,
      dockerVersion: version.Version || "unknown",
      hostId,
      hostName: host.name,
      images: info.Images || 0,
      kernelVersion: info.KernelVersion || "unknown",
      os: info.OperatingSystem || "unknown",
      systemTime: info.SystemTime || new Date().toISOString(),
      totalCPU: info.NCPU || 0,
      totalMemory: info.MemTotal || 0,
    }
  }
}

export default HostMetricsMonitor
