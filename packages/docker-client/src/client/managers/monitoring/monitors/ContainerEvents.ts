import Logger from "@dockstat/logger"
import type { DATABASE, DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"
import { mapContainerInfo } from "../../../utils/mapContainerInfo"
import { retry } from "@dockstat/utils"

class ContainerEventMonitor {
  private logger: Logger
  private intervalId?: ReturnType<typeof setInterval>
  private dockerInstances: Map<number, Dockerode>
  private lastContainerStates = new Map<string, DOCKER.ContainerInfo[]>()
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
    this.logger = baseLogger.spawn("CEM")
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.options = options
  }

  start(): void {
    this.logger.info(`Starting container event monitoring at interval ${this.options.interval}ms`)
    this.intervalId = setInterval(() => this.monitorChanges(), this.options.interval)
    this.captureInitialStates().catch((error) => {
      proxyEvent("error", error instanceof Error ? error : new Error(String(error)))
    })
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  getLastContainerStates(): Map<string, DOCKER.ContainerInfo[]> {
    return new Map(this.lastContainerStates)
  }

  updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts
  }

  updateDockerInstances(instances: Map<number, Dockerode>): void {
    this.dockerInstances = instances
  }

  private async captureInitialStates(): Promise<void> {
    const promises = this.hosts.map(async (host) => {
      try {
        const hostId = host.id ?? 0
        const containers = await this.getContainersForHost(hostId)
        this.lastContainerStates.set(`host-${hostId}`, containers)
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: host.id ?? 0,
        })
      }
    })
    await Promise.allSettled(promises)
  }

  private async monitorChanges(): Promise<void> {
    this.logger.debug(`Checking for changes`)
    const promises = this.hosts.map(async (host) => {
      try {
        const hostId = host.id ?? 0
        const current = await this.getContainersForHost(hostId)
        const last = this.lastContainerStates.get(`host-${hostId}`) || []
        this.detectChanges(hostId, last, current)
        this.lastContainerStates.set(`host-${hostId}`, current)
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: host.id ?? 0,
        })
      }
    })
    await Promise.allSettled(promises)
  }

  private detectChanges(
    hostId: number,
    last: DOCKER.ContainerInfo[],
    current: DOCKER.ContainerInfo[]
  ): void {
    const lastMap = new Map(last.map((c) => [c.id, c]))
    const currentMap = new Map(current.map((c) => [c.id, c]))

    for (const container of current) {
      if (!lastMap.has(container.id)) {
        proxyEvent("container:created", {
          containerId: container.id,
          containerInfo: container,
          hostId,
        })
      } else {
        const lastContainer = lastMap.get(container.id)
        if (lastContainer && lastContainer.state !== container.state) {
          if (container.state === "running" && lastContainer.state !== "running") {
            proxyEvent("container:started", {
              containerId: container.id,
              containerInfo: container,
              hostId,
            })
          } else if (container.state !== "running" && lastContainer.state === "running") {
            proxyEvent("container:stopped", {
              containerId: container.id,
              containerInfo: container,
              hostId,
            })
          }
        }
      }
    }

    for (const lastContainer of last) {
      if (!currentMap.has(lastContainer.id)) {
        proxyEvent("container:removed", {
          containerId: lastContainer.id,
          hostId,
        })
      }
    }
  }

  private async getContainersForHost(hostId: number): Promise<DOCKER.ContainerInfo[]> {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      const availableKeys = Array.from(this.dockerInstances.keys())
      throw new Error(
        `No Docker instance found for host ${hostId}. Available instances: ${availableKeys.join(", ")}`
      )
    }
    const containers = await retry(() => docker.listContainers({ all: true }), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })
    return containers.map((c) => mapContainerInfo(c, hostId))
  }
}

export default ContainerEventMonitor
