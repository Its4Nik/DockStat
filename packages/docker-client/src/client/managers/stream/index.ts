import type Logger from "@dockstat/logger"
import type { DOCKER } from "@dockstat/typings"
import { proxyEvent } from "../../../events/workerEventProxy"
/**
 * Narrow, runtime-safe client surface used by StreamManager to avoid circular mixin typing.
 * This interface lists only the methods/properties StreamManager calls.
 */
export interface StreamCapableClient {
  getContainerStats(hostId: number, containerId: string): Promise<DOCKER.ContainerStatsInfo>
  getContainersForHost(hostId: number): Promise<DOCKER.ContainerInfo[]>
  getAllContainers(): Promise<DOCKER.ContainerInfo[]>
  getContainerLogs(
    hostId: number,
    containerId: string,
    options?: {
      stdout?: boolean
      stderr?: boolean
      timestamps?: boolean
      tail?: number
      since?: string
      until?: string
    }
  ): Promise<string>
  monitoringManager?: {
    getHostMetrics(hostId: number): Promise<DOCKER.HostMetrics>
    getAllHostMetrics(): Promise<DOCKER.HostMetrics[]>
    getAllStats(): Promise<DOCKER.AllStatsResponse>
  }
}

export const STREAM_CHANNELS: Record<string, DOCKER.StreamChannel> = {
  all_stats: {
    defaultInterval: 5000,
    description: "Combined container stats and host metrics",
    name: "all_stats",
    requiresContainerId: false,
    requiresHostId: false,
    type: "all_stats",
  },
  container_list: {
    defaultInterval: 2000,
    description: "Container list updates",
    name: "container_list",
    requiresContainerId: false,
    requiresHostId: false,
    type: "container_list",
  },
  container_logs: {
    defaultInterval: 500,
    description: "Container log streams",
    name: "container_logs",
    requiresContainerId: true,
    requiresHostId: true,
    type: "container_logs",
  },
  container_stats: {
    defaultInterval: 1000,
    description: "Real-time container statistics",
    name: "container_stats",
    requiresContainerId: true,
    requiresHostId: true,
    type: "container_stats",
  },
  docker_events: {
    defaultInterval: 0, // Event-driven
    description: "Docker daemon events",
    name: "docker_events",
    requiresContainerId: false,
    requiresHostId: false,
    type: "docker_events",
  },
  host_metrics: {
    defaultInterval: 5000,
    description: "Host system metrics",
    name: "host_metrics",
    requiresContainerId: false,
    requiresHostId: true,
    type: "host_metrics",
  },
}

export default class StreamManager {
  private logger
  private subscriptions: Map<string, DOCKER.StreamSubscription> = new Map()
  private streamIntervals: Map<string, NodeJS.Timeout> = new Map()
  private dockerClient: StreamCapableClient // Reference to DockerClient
  private activeConnections: Set<string> = new Set()
  private heartbeatInterval?: NodeJS.Timeout
  private readonly heartbeatIntervalMs = 30000 // 30 seconds

  constructor(dockerClient: StreamCapableClient, baseLogger: Logger) {
    this.logger = baseLogger.spawn("SM")
    this.logger.info("Initializing StreamManager")
    this.dockerClient = dockerClient
    this.setupHeartbeat()
  }

  public createConnection(connectionId: string): void {
    this.logger.info(`Creating new connection: ${connectionId}`)
    this.activeConnections.add(connectionId)
    proxyEvent("connection:created", { connectionId })
  }

  public closeConnection(connectionId: string): void {
    this.logger.info(`Closing connection: ${connectionId}`)
    // Unsubscribe from all channels for this connection
    const subscriptionsToRemove = Array.from(this.subscriptions.values()).filter((sub) =>
      sub.id.startsWith(connectionId)
    )

    this.logger.debug(`Found ${subscriptionsToRemove.length} subscriptions to remove`)
    for (const sub of subscriptionsToRemove) {
      this.unsubscribe(sub.id)
    }

    this.activeConnections.delete(connectionId)
    proxyEvent("connection:closed", { connectionId })
  }

  public handleMessage(connectionId: string, rawMessage: string): void {
    this.logger.debug(`Handling message from connection ${connectionId}`)
    try {
      const message: DOCKER.StreamMessage = JSON.parse(rawMessage)
      message.timestamp = Date.now()
      this.logger.debug(`Message type: ${message.type}`)

      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(connectionId, message)
          break
        case "unsubscribe":
          this.handleUnsubscribe(connectionId, message)
          break
        case "ping":
          this.handlePing(connectionId, message)
          break
        default:
          this.sendMessage(connectionId, {
            error: `Unknown message type: ${message.type}`,
            id: message.id || "unknown",
            timestamp: Date.now(),
            type: "error",
          })
      }
    } catch (error) {
      this.sendMessage(connectionId, {
        error: `Failed to parse message: ${error instanceof Error ? error.message : "Unknown error"}`,
        id: "parse_error",
        timestamp: Date.now(),
        type: "error",
      })
    }
  }

  public subscribe(
    connectionId: string,
    channel: string,
    options: DOCKER.StreamOptions,
    callback: (message: DOCKER.StreamMessage) => void
  ): string {
    const subscriptionId = `${connectionId}:${channel}:${Date.now()}`

    const channelDef = STREAM_CHANNELS[channel]
    if (!channelDef) {
      throw new Error(`Unknown channel: ${channel}`)
    }

    // Validate required options
    if (channelDef.requiresHostId && !options.hostId) {
      throw new Error(`Channel ${channel} requires hostId`)
    }

    if (channelDef.requiresContainerId && !options.containerId) {
      throw new Error(`Channel ${channel} requires containerId`)
    }

    const subscription: DOCKER.StreamSubscription = {
      active: true,
      callback,
      channel,
      id: subscriptionId,
      lastActivity: Date.now(),
      options: {
        interval: options.interval || channelDef.defaultInterval,
        ...options,
      },
    }

    this.subscriptions.set(subscriptionId, subscription)
    this.startStream(subscription)

    return subscriptionId
  }

  public unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId)
    if (!subscription) {
      return false
    }

    subscription.active = false
    this.stopStream(subscriptionId)
    this.subscriptions.delete(subscriptionId)

    return true
  }

  public getSubscriptions(connectionId?: string): DOCKER.StreamSubscription[] {
    const allSubscriptions = Array.from(this.subscriptions.values())

    if (connectionId) {
      return allSubscriptions.filter((sub) => sub.id.startsWith(connectionId))
    }

    return allSubscriptions
  }

  public getAvailableChannels(): DOCKER.StreamChannel[] {
    return Object.values(STREAM_CHANNELS)
  }

  public sendMessage(connectionId: string, message: DOCKER.StreamMessage): void {
    if (!this.activeConnections.has(connectionId)) {
      return
    }
    proxyEvent("message:send", { connectionId, message })
  }

  public broadcast(message: DOCKER.StreamMessage): void {
    for (const connectionId of Array.from(this.activeConnections)) {
      this.sendMessage(connectionId, message)
    }
  }

  public cleanup(): void {
    for (const [, timeout] of Array.from(this.streamIntervals)) {
      clearInterval(timeout)
    }
    this.streamIntervals.clear()

    this.subscriptions.clear()

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.activeConnections.clear()
  }

  private handleSubscribe(connectionId: string, message: DOCKER.StreamMessage): void {
    try {
      const { channel, data: options = {} } = message

      if (!channel) {
        throw new Error("Channel is required for subscription")
      }

      const subscriptionId = this.subscribe(connectionId, channel, options, (streamMessage) =>
        this.sendMessage(connectionId, streamMessage)
      )

      // Send back a subscription response that matches the updated typing
      this.sendMessage(connectionId, {
        channel,
        data: {
          channel,
          options: {
            ...(options as DOCKER.StreamOptions),
          },
          status: "subscribed" as const,
          subscriptionId,
        },
        id: message.id,
        timestamp: Date.now(),
        type: "data",
      })
    } catch (error) {
      this.sendMessage(connectionId, {
        error: error instanceof Error ? error.message : "Subscription failed",
        id: message.id,
        timestamp: Date.now(),
        type: "error",
      })
    }
  }

  private handleUnsubscribe(connectionId: string, message: DOCKER.StreamMessage): void {
    const { data } = message
    const subscriptionId = (data as { subscriptionId: string })?.subscriptionId as string

    if (!subscriptionId) {
      this.sendMessage(connectionId, {
        error: "Subscription ID is required for unsubscribe",
        id: message.id,
        timestamp: Date.now(),
        type: "error",
      })
      return
    }

    // Capture existing subscription info (if available) before it is removed
    const existingSub = this.subscriptions.get(subscriptionId)

    const success = this.unsubscribe(subscriptionId)

    const responseData: {
      subscriptionId: string
      channel: string
      status: "subscribed" | "unsubscribed" | "not_found"
      options: DOCKER.StreamOptions
    } = {
      channel: existingSub?.channel ?? subscriptionId.split(":")[1] ?? "unknown",
      options: existingSub?.options ?? {},
      status: success ? "unsubscribed" : "not_found",
      subscriptionId,
    }

    this.sendMessage(connectionId, {
      data: responseData,
      id: message.id,
      timestamp: Date.now(),
      type: "data",
    })
  }

  private handlePing(connectionId: string, message: DOCKER.StreamMessage): void {
    this.sendMessage(connectionId, {
      id: message.id,
      timestamp: Date.now(),
      type: "pong",
    })
  }

  private startStream(subscription: DOCKER.StreamSubscription): void {
    const { channel } = subscription

    switch (channel) {
      case "container_stats":
        this.startContainerStatsStream(subscription)
        break
      case "host_metrics":
        this.startHostMetricsStream(subscription)
        break
      case "container_list":
        this.startContainerListStream(subscription)
        break
      case "container_logs":
        this.startContainerLogsStream(subscription)
        break
      case "docker_events":
        this.startDockerEventsStream(subscription)
        break
      case "all_stats":
        this.startAllStatsStreamForSubscription(subscription)
        break
      default:
        throw new Error(`Unsupported channel: ${channel}`)
    }
  }

  private stopStream(subscriptionId: string): void {
    const interval = this.streamIntervals.get(subscriptionId)
    if (interval) {
      clearInterval(interval)
      this.streamIntervals.delete(subscriptionId)
    }
  }

  private startContainerStatsStream(subscription: DOCKER.StreamSubscription): void {
    const { id, options } = subscription
    const { hostId, containerId, interval = 1000 } = options

    if (!hostId || !containerId) {
      return
    }

    const timer = setInterval(async () => {
      if (!subscription.active) return

      try {
        const statsInfo = await this.dockerClient.getContainerStats(hostId, containerId)

        subscription.callback({
          channel: "container_stats",
          data: statsInfo,
          id: `stats-${Date.now()}`,
          timestamp: Date.now(),
          type: "data",
        })
        subscription.lastActivity = Date.now()
      } catch (error) {
        subscription.callback({
          channel: "container_stats",
          error: error instanceof Error ? error.message : "Failed to get container stats",
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          type: "error",
        })
      }
    }, interval)

    this.streamIntervals.set(id, timer)
  }

  private startHostMetricsStream(subscription: DOCKER.StreamSubscription): void {
    const { id, options } = subscription
    const { hostId, interval = 5000 } = options

    const timer = setInterval(async () => {
      if (!subscription.active) return

      try {
        const mm = this.dockerClient.monitoringManager
        if (!mm) {
          throw new Error("Monitoring manager not initialized")
        }

        const metrics = hostId ? await mm.getHostMetrics(hostId) : await mm.getAllHostMetrics()

        subscription.callback({
          channel: "host_metrics",
          data: metrics,
          id: `metrics-${Date.now()}`,
          timestamp: Date.now(),
          type: "data",
        })
        subscription.lastActivity = Date.now()
      } catch (error) {
        subscription.callback({
          channel: "host_metrics",
          error: error instanceof Error ? error.message : "Failed to get host metrics",
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          type: "error",
        })
      }
    }, interval)

    this.streamIntervals.set(id, timer)
  }

  private startContainerListStream(subscription: DOCKER.StreamSubscription): void {
    const { id, options } = subscription
    const { hostId, interval = 2000, filters } = options

    const timer = setInterval(async () => {
      if (!subscription.active) return

      try {
        let containers = hostId
          ? await this.dockerClient.getContainersForHost(hostId)
          : await this.dockerClient.getAllContainers()

        // Apply filters if specified
        if (filters) {
          containers = this.applyContainerFilters(containers, filters)
        }

        subscription.callback({
          channel: "container_list",
          data: containers,
          id: `containers-${Date.now()}`,
          timestamp: Date.now(),
          type: "data",
        })
        subscription.lastActivity = Date.now()
      } catch (error) {
        subscription.callback({
          channel: "container_list",
          error: error instanceof Error ? error.message : "Failed to get container list",
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          type: "error",
        })
      }
    }, interval)

    this.streamIntervals.set(id, timer)
  }

  private startContainerLogsStream(subscription: DOCKER.StreamSubscription): void {
    const { id, options } = subscription
    const { hostId, containerId, logLines = 100 } = options

    if (!hostId || !containerId) {
      return
    }

    // This would require implementing log streaming in the Docker client
    // For now, we'll provide a basic implementation
    const timer = setInterval(async () => {
      if (!subscription.active) return

      try {
        // This is a placeholder - you'd need to implement actual log streaming
        const logs = await this.getContainerLogs(hostId, containerId, logLines)
        const logData: DOCKER.ContainerLogs = {
          containerId,
          hostId,
          logs,
          timestamp: Date.now(),
        }

        subscription.callback({
          channel: "container_logs",
          data: logData,
          id: `logs-${Date.now()}`,
          timestamp: Date.now(),
          type: "data",
        })
        subscription.lastActivity = Date.now()
      } catch (error) {
        subscription.callback({
          channel: "container_logs",
          error: error instanceof Error ? error.message : "Failed to get container logs",
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          type: "error",
        })
      }
    }, 1000)

    this.streamIntervals.set(id, timer)
  }

  private startDockerEventsStream(subscription: DOCKER.StreamSubscription): void {
    // This stream is event-driven, so we don't need a timer
    // Instead, we listen to the event emitter
    subscription.lastActivity = Date.now()
  }

  private startAllStatsStreamForSubscription(subscription: DOCKER.StreamSubscription): void {
    const { id, options } = subscription
    const { interval = 5000 } = options

    const timer = setInterval(async () => {
      if (!subscription.active) return

      try {
        const mm = this.dockerClient.monitoringManager
        if (!mm) {
          throw new Error("Monitoring manager not initialized")
        }

        const allStats = await mm.getAllStats()

        subscription.callback({
          channel: "all_stats",
          data: allStats,
          id: `all-stats-${Date.now()}`,
          timestamp: Date.now(),
          type: "data",
        })
        subscription.lastActivity = Date.now()
      } catch (error) {
        subscription.callback({
          channel: "all_stats",
          error: error instanceof Error ? error.message : "Failed to get all stats",
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          type: "error",
        })
      }
    }, interval)

    this.streamIntervals.set(id, timer)
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast({
        id: `heartbeat-${Date.now()}`,
        timestamp: Date.now(),
        type: "ping",
      })
    }, this.heartbeatIntervalMs)
  }

  private applyContainerFilters(
    containers: DOCKER.ContainerInfo[],
    filters: NonNullable<DOCKER.StreamOptions["filters"]>
  ): DOCKER.ContainerInfo[] {
    let filtered = containers

    if (filters.containerNames?.length) {
      filtered = filtered.filter((container) =>
        filters.containerNames?.some((name) => container.name.includes(name))
      )
    }

    if (filters.containerStates?.length) {
      filtered = filtered.filter((container) => filters.containerStates?.includes(container.state))
    }

    if (filters.imageNames?.length) {
      filtered = filtered.filter((container) =>
        filters.imageNames?.some((image) => container.image.includes(image))
      )
    }

    return filtered
  }

  private async getContainerLogs(
    hostId: number,
    containerId: string,
    lines: number
  ): Promise<string[]> {
    try {
      const logsString = await this.dockerClient.getContainerLogs(hostId, containerId, {
        stderr: true,
        stdout: true,
        tail: lines,
        timestamps: true,
      })

      return logsString.split("\n").filter((line: string) => line.trim().length > 0)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`Failed to get container logs for ${containerId}:`, errorMessage)
      return []
    }
  }
}
