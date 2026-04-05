import type { Docker } from "@dockstat/docker"
import type Logger from "@dockstat/logger"
import type { DATABASE } from "@dockstat/typings"
import { retry } from "@dockstat/utils"
import { proxyEvent } from "../../../events/workerEventProxy"
import type { ExtendedContainerInfo } from "../../mixins/containers/index.ts"

class DockerEventStreamManager {
  private intervalId?: ReturnType<typeof setInterval>
  private lastEventTime = new Map<number, number>()
  private logger: Logger
  private dockerInstances: Map<number, Docker>
  private hosts: DATABASE.DB_target_host[]
  private clientId: number
  private options: { retryAttempts: number; retryDelay: number }

  constructor(
    clientId: number,
    baseLogger: Logger,
    dockerInstances: Map<number, Docker>,
    hosts: DATABASE.DB_target_host[],
    options: {
      retryAttempts: number
      retryDelay: number
    }
  ) {
    this.clientId = clientId
    this.logger = baseLogger.spawn("DESM")
    this.dockerInstances = dockerInstances
    this.hosts = hosts
    this.options = options
  }

  start(): void {
    this.logger.info(`Starting Docker event polling for ${this.hosts.length} hosts`)
    for (const host of this.hosts) {
      this.startPollingForHost(host)
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    this.lastEventTime.clear()
  }

  restart(): void {
    this.stop()
    this.start()
  }

  updateHosts(hosts: DATABASE.DB_target_host[]): void {
    this.hosts = hosts
  }

  updateDockerInstances(instances: Map<number, Docker>): void {
    this.dockerInstances = instances
  }

  getStreams(): Map<number, NodeJS.ReadableStream> {
    // Return empty map since we're using polling instead of streaming
    return new Map()
  }

  private startPollingForHost(host: DATABASE.DB_target_host): void {
    const hostId = Number(host.id)
    this.logger.debug(`Starting event polling for host ${hostId}`)

    // Poll events every 5 seconds
    const pollingInterval = 5000
    this.intervalId = setInterval(() => this.pollEventsForHost(hostId), pollingInterval)

    // Initial poll
    this.pollEventsForHost(hostId).catch((error) => {
      proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
        hostId,
        message: "Could not start initial docker event polling",
      })
    })
  }

  private async pollEventsForHost(hostId: number): Promise<void> {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      this.logger.warn(`Docker instance not found for host ${hostId}`)
      return
    }

    try {
      // Get last event time for this host, or use 0 if this is the first poll
      const lastTime = this.lastEventTime.get(hostId) || 0

      // Fetch events since last known time
      const events = await retry(
        () =>
          docker.system.events({
            since: lastTime,
            until: Math.floor(Date.now() / 1000), // Current time
          }),
        {
          attempts: this.options.retryAttempts,
          delay: this.options.retryDelay,
        }
      )

      // Process each event
      for (const event of events) {
        if (event.time) {
          // Update last event time
          this.lastEventTime.set(hostId, event.time)

          // Handle the event
          this.handleEvent(hostId, event)
        }
      }
    } catch (error) {
      proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
        hostId,
        message: "Docker event polling failed",
      })
    }
  }

  private handleEvent(hostId: number, event: any): void {
    // @bun-docker events structure: {
    //   Type: string,
    //   Action: string,
    //   Actor: {
    //     ID: string,
    //     Attributes: Record<string, string>
    //   },
    //   time: number,
    //   timeNano: number
    // }

    // Only handle container events
    if (event.Type !== "container") {
      return
    }

    const containerId = event.Actor?.ID
    if (!containerId) {
      return
    }

    const action = event.Action
    this.logger.debug(
      `Handling Docker Event (${action}) for container ${containerId} on host ${hostId}`
    )

    switch (action) {
      case "start":
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            proxyEvent("container:started", {
              containerId,
              containerInfo,
              hostId,
            })
          })
          .catch((error) => {
            proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
              containerId,
              hostId,
              message: "Could not handle docker Start Event",
            })
          })
        break

      case "stop":
      case "die":
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            proxyEvent("container:stopped", {
              containerId,
              containerInfo,
              hostId,
            })
          })
          .catch((error) => {
            proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
              containerId,
              hostId,
              message: "Could not handle docker Stop/Die Event",
            })
          })
        break

      case "create":
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            proxyEvent("container:created", {
              containerId,
              containerInfo,
              hostId,
            })
          })
          .catch((error) => {
            proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
              containerId,
              hostId,
              message: "Could not handle docker Create Event",
            })
          })
        break

      case "destroy":
      case "remove":
        proxyEvent("container:removed", {
          containerId,
          hostId,
        })
        break

      case "pause":
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            proxyEvent("container:paused", {
              containerId,
              containerInfo,
              hostId,
            })
          })
          .catch((error) => {
            proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
              containerId,
              hostId,
              message: "Could not handle docker Pause Event",
            })
          })
        break

      case "unpause":
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            proxyEvent("container:unpaused", {
              containerId,
              containerInfo,
              hostId,
            })
          })
          .catch((error) => {
            proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
              containerId,
              hostId,
              message: "Could not handle docker Unpause Event",
            })
          })
        break

      case "restart":
        this.getContainerInfo(hostId, containerId)
          .then((containerInfo) => {
            proxyEvent("container:restarted", {
              containerId,
              containerInfo,
              hostId,
            })
          })
          .catch((error) => {
            proxyEvent("error", error instanceof Error ? error : new Error(String(error)), {
              containerId,
              hostId,
              message: "Could not handle docker Restart Event",
            })
          })
        break

      default:
        this.logger.debug(`Unhandled Docker event action: ${action}`)
        break
    }
  }

  private async getContainerInfo(
    hostId: number,
    containerId: string
  ): Promise<ExtendedContainerInfo> {
    const docker = this.dockerInstances.get(hostId)
    if (!docker) {
      throw new Error(`Docker instance not found for host ${hostId}`)
    }

    const info = await retry(() => docker.containers.inspect(containerId), {
      attempts: this.options.retryAttempts,
      delay: this.options.retryDelay,
    })

    return {
      ...info,
      hostId,
      clientId: this.clientId,
    } as ExtendedContainerInfo
  }
}

export default DockerEventStreamManager
