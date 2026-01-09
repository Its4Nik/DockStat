import type Logger from "@dockstat/logger"
import type { DATABASE, DB_target_host } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import type Dockerode from "dockerode"
import { proxyEvent } from "../../../../events/workerEventProxy"

class HealthCheckMonitor {
  private intervalId?: ReturnType<typeof setInterval>
  private lastHealthStatus = new Map<number, boolean>()
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
    this.logger = baseLogger.spawn("HCM")
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.options = options
  }

  start(): void {
    this.logger.debug(`Starting health checks at interval ${this.options.interval}ms`)
    this.intervalId = setInterval(() => this.performChecks(), this.options.interval)
    this.performChecks().catch((error) => {
      proxyEvent("error", {
        message: error.message || String(error),
        name: "",
        stack: error.stack,
      })
    })
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  getLastHealthStatus(): Map<number, boolean> {
    return new Map(this.lastHealthStatus)
  }

  updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts
  }

  updateDockerInstances(instances: Map<number, Dockerode>): void {
    this.dockerInstances = instances
  }

  private async performChecks(): Promise<void> {
    this.logger.debug("Performing health checks")
    const promises = this.hosts.map((host) => this.checkHost(host))
    await Promise.allSettled(promises)
  }

  private async checkHost(host: DATABASE.DB_target_host): Promise<void> {
    try {
      const docker = this.dockerInstances.get(Number(host.id))
      if (!docker) {
        throw new Error(`No Docker instance found for host ${host.id}`)
      }

      await retry(() => docker.ping(), {
        attempts: this.options.retryAttempts,
        delay: this.options.retryDelay,
      })

      const wasHealthy = this.lastHealthStatus.get(Number(host.id))
      if (wasHealthy !== true) {
        this.lastHealthStatus.set(Number(host.id), true)
        proxyEvent("host:health:changed", {
          healthy: true,
          hostId: Number(host.id),
          hostName: host.name,
        })
      }
    } catch (error) {
      const wasHealthy = this.lastHealthStatus.get(host.id as Required<DB_target_host>["id"])
      if (wasHealthy !== false) {
        this.lastHealthStatus.set(host.id as Required<DB_target_host>["id"], false)
        proxyEvent("host:health:changed", {
          healthy: false,
          hostId: Number(host.id),
          hostName: host.name,
        })
      }
      proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
        hostId: host.id,
        message: "Error while performing Health Checks",
      })
    }
  }
}

export default HealthCheckMonitor
