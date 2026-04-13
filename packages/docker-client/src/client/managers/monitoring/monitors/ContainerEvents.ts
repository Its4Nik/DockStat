import type { Docker } from "@dockstat/docker"
import type Logger from "@dockstat/logger"
import type { DATABASE } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import { proxyEvent } from "../../../../events/workerEventProxy"
import type { ExtendedContainerInfo } from "../../../mixins/containers/index.ts"

/**
 * Map ExtendedContainerInfo to object with lowercase properties for proxyEvent compatibility
 * @bun-docker uses uppercase properties (Id, Name, State) but proxyEvent expects lowercase (id, name, state)
 */
function mapToLowercaseProperties(container: ExtendedContainerInfo) {
  return {
    clientId: container.clientId,
    created: container.Created ? Math.floor(new Date(container.Created).getTime() / 1000) : 0,
    hostId: container.hostId,
    id: container.Id || "",
    image: container.Image || "unknown",
    labels: container.Labels || {},
    name: container.Names?.[0]?.replace(/^\//, "") || "unknown",
    ports: (container.Ports || []).map((port) => ({
      privatePort: port.PrivatePort,
      publicPort: port.PublicPort,
      type: port.Type || "tcp",
    })),
    state: container.State || "unknown",
    status: container.State || "unknown",
  }
}

class ContainerEventMonitor {
  private logger: Logger
  private intervalId?: ReturnType<typeof setInterval>
  private dockerInstances: Map<number, Docker>
  private lastContainerStates = new Map<number, ExtendedContainerInfo[]>()
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

  getLastContainerStates(): Map<number, ExtendedContainerInfo[]> {
    return new Map(this.lastContainerStates)
  }

  updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts
  }

  updateDockerInstances(instances: Map<number, Docker>): void {
    this.dockerInstances = instances
  }

  private async captureInitialStates(): Promise<void> {
    const promises = this.hosts.map(async (host) => {
      try {
        const hostId = Number(host.id ?? 0)
        const containers = await this.getContainersForHost(hostId)
        this.lastContainerStates.set(hostId, containers)
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: Number(host.id ?? 0),
        })
      }
    })
    await Promise.allSettled(promises)
  }

  private async monitorChanges(): Promise<void> {
    this.logger.debug(`Checking for changes`)
    const promises = this.hosts.map(async (host) => {
      try {
        const hostId = Number(host.id ?? 0)
        const current = await this.getContainersForHost(hostId)
        const last = this.lastContainerStates.get(hostId) || []
        this.detectChanges(hostId, last, current)
        this.lastContainerStates.set(hostId, current)
      } catch (error) {
        proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
          hostId: Number(host.id ?? 0),
        })
      }
    })
    await Promise.allSettled(promises)
  }

  private detectChanges(
    hostId: number,
    last: ExtendedContainerInfo[],
    current: ExtendedContainerInfo[]
  ): void {
    const lastMap = new Map(last.map((c) => [c.Id, c]))
    const currentMap = new Map(current.map((c) => [c.Id, c]))

    for (const container of current) {
      if (!lastMap.has(container.Id)) {
        proxyEvent("container:created", {
          containerId: container.Id || "",
          containerInfo: mapToLowercaseProperties(container),
          hostId,
        })
      } else {
        const lastContainer = lastMap.get(container.Id)
        if (lastContainer && lastContainer.State !== container.State) {
          if (container.State === "running" && lastContainer.State !== "running") {
            proxyEvent("container:started", {
              containerId: container.Id || "",
              containerInfo: mapToLowercaseProperties(container),
              hostId,
            })
          } else if (container.State === "exited" && lastContainer.State === "running") {
            proxyEvent("container:stopped", {
              containerId: container.Id || "",
              containerInfo: mapToLowercaseProperties(container),
              hostId,
            })
          } else if (container.State === "dead" && lastContainer.State === "running") {
            proxyEvent("container:died", {
              containerId: container.Id || "",
              containerInfo: mapToLowercaseProperties(container),
              hostId,
            })
          } else if (container.State === "paused" && lastContainer.State !== "paused") {
            proxyEvent("container:paused", {
              containerId: container.Id || "",
              containerInfo: mapToLowercaseProperties(container),
              hostId,
            })
          } else if (container.State === "running" && lastContainer.State === "paused") {
            proxyEvent("container:unpaused", {
              containerId: container.Id || "",
              containerInfo: mapToLowercaseProperties(container),
              hostId,
            })
          }
        }
      }
    }

    for (const container of last) {
      if (!currentMap.has(container.Id)) {
        proxyEvent("container:removed", {
          containerId: container.Id || "",
          hostId: container.hostId,
        })
      }
    }
  }

  private async getContainersForHost(hostId: number): Promise<ExtendedContainerInfo[]> {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      throw new Error(`Docker instance not found for host ${hostId}`)
    }

    const containers = await retry(() => docker.containers.list({ all: true }), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    return containers.map((c) => ({
      ...c,
      clientId: this.clientId,
      hostId,
    }))
  }
}

export default ContainerEventMonitor
