import Logger from "@dockstat/logger"
import DB from "@dockstat/sqlite-wrapper"
import type { DOCKER } from "@dockstat/typings"
import DockerClient, { type DockerClientInstance } from "./client"
import { proxyEvent } from "./events/workerEventProxy"
import type { WorkerRequest, WorkerResponse } from "./shared/types"

declare const self: Worker

type InitMessage = {
  type: "__init__"
  dbPath: string
  clientId: number
  clientName: string
  options: DOCKER.DockerAdapterOptions
}

type MetricsMessage = {
  type: "__get_metrics__"
}

type InboundMessage = WorkerRequest | InitMessage | MetricsMessage

let client: DockerClientInstance | null = null
let clientId = -1
let clientName = "unknown"

function requireClient(): DockerClientInstance {
  if (!client) throw new Error("DockerClient not initialized")
  return client
}

self.onmessage = async (event: MessageEvent<InboundMessage>) => {
  const msg = event.data

  // Handle initialization
  if (msg.type === "__init__") {
    try {
      const db = new DB(msg.dbPath)
      clientId = Number(msg.clientId)
      clientName = msg.clientName

      const logger = new Logger(`DockerClient-${clientId}`)
      client = new DockerClient(clientId, clientName, db, msg.options, logger)

      // Initialize with whatever is already in the host table; explicit init with hosts can come later.
      if ("init" in client && typeof client.init === "function") {
        client.init()
      }

      self.postMessage({
        type: "__init_complete__",
        success: true,
      })
    } catch (error) {
      self.postMessage({
        type: "__init_complete__",
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return
  }

  // Handle metrics probe
  if (msg.type === "__get_metrics__") {
    if (!client) {
      self.postMessage({
        type: "__metrics__",
        data: null,
      })
      return
    }
    self.postMessage({
      type: "__metrics__",
      data: {
        ...client.getMetrics(),
        clientId,
        clientName,
      },
    })
    return
  }

  // From here down, handle WorkerRequest messages
  const request = msg as WorkerRequest
  const requestId = request.requestId ?? ""

  const ok = <T>(data: T): WorkerResponse<T> => ({ success: true, data, requestId })
  const fail = (error: unknown): WorkerResponse<never> => ({
    success: false,
    error: error instanceof Error ? error.message : String(error),
    requestId,
  })

  try {
    const c = requireClient()
    let result: unknown

    switch (request.type) {
      // Hosts and core lifecycle
      case "init":
        c.init(request.hosts)
        result = undefined
        break
      case "ping":
        result = await c.ping()
        break
      case "addHost":
        result = c.addHost(request.data)
        break
      case "removeHost":
        c.removeHost(request.hostId)
        result = undefined
        break
      case "updateHost":
        c.updateHost(request.host)
        result = undefined
        break
      case "getHosts":
        result = c.getHosts()
        break

      // Containers
      case "getAllContainers":
        result = await c.getAllContainers()
        break
      case "getContainersForHost":
        result = await c.getContainersForHost(request.hostId)
        break
      case "getContainer":
        result = await c.getContainer(request.hostId, request.containerId)
        break
      case "getAllContainerStats":
        result = await c.getAllContainerStats()
        break
      case "getContainerStatsForHost":
        result = await c.getContainerStatsForHost(request.hostId)
        break
      case "getContainerStats":
        result = await c.getContainerStats(request.hostId, request.containerId)
        break
      case "startContainer":
        await c.startContainer(request.hostId, request.containerId)
        result = undefined
        break
      case "stopContainer":
        await c.stopContainer(request.hostId, request.containerId)
        result = undefined
        break
      case "restartContainer":
        await c.restartContainer(request.hostId, request.containerId)
        result = undefined
        break
      case "removeContainer":
        await c.removeContainer(request.hostId, request.containerId, request.force ?? false)
        result = undefined
        break
      case "pauseContainer":
        await c.pauseContainer(request.hostId, request.containerId)
        result = undefined
        break
      case "unpauseContainer":
        await c.unpauseContainer(request.hostId, request.containerId)
        result = undefined
        break
      case "killContainer":
        await c.killContainer(request.hostId, request.containerId, request.signal)
        result = undefined
        break
      case "renameContainer":
        await c.renameContainer(request.hostId, request.containerId, request.newName)
        result = undefined
        break
      case "getContainerLogs":
        result = await c.getContainerLogs(request.hostId, request.containerId, request.options)
        break
      case "execInContainer":
        result = await c.execInContainer(
          request.hostId,
          request.containerId,
          request.command,
          request.options
        )
        break

      // Images
      case "getImages":
        result = await c.getImages(request.hostId)
        break
      case "pullImage":
        await c.pullImage(request.hostId, request.imageName)
        result = undefined
        break

      // Networks & Volumes
      case "getNetworks":
        result = await c.getNetworks(request.hostId)
        break
      case "getVolumes":
        result = await c.getVolumes(request.hostId)
        break

      // System
      case "getSystemInfo":
        result = await c.getSystemInfo(request.hostId)
        break
      case "getSystemVersion":
        result = await c.getSystemVersion(request.hostId)
        break
      case "getDiskUsage":
        result = await c.getDiskUsage(request.hostId)
        break
      case "pruneSystem":
        result = await c.pruneSystem(request.hostId)
        break

      // Monitoring (lifecycle via mixin)
      case "createMonitoringManager":
        c.createMonitoringManager()
        result = "Created Monitoring manager"
        break
      case "startMonitoring":
        c.startMonitoring()
        result = undefined
        break
      case "stopMonitoring":
        c.stopMonitoring()
        result = undefined
        break
      case "isMonitoring":
        result = c.isMonitoring()
        break
      case "hasMonitoringManager":
        result = c.hasMonitoringManager()
        break

      // Monitoring (data paths via MonitoringManager)
      case "getAllHostMetrics":
        result = await c.monitoringManager?.getAllHostMetrics()
        break
      case "getHostMetrics":
        result = await c.monitoringManager?.getHostMetrics(request.hostId)
        break
      case "getAllStats":
        result = await c.monitoringManager?.getAllStats()
        break
      case "checkHostHealth":
        result = await c.monitoringManager?.checkHostHealth(request.hostId)
        break
      case "checkAllHostsHealth":
        result = await c.monitoringManager?.checkAllHostsHealth()
        break

      // Cleanup
      case "cleanup":
        try {
          // Best-effort stop monitoring if present
          if (c.hasMonitoringManager()) {
            c.stopMonitoring()
          }
        } catch {
          // ignore
        }
        // Dispose client resources
        c.dispose()
        result = undefined
        break

      case "deleteTable":
        result = c.deleteTable()
        break

      // Streams
      case "stream_createConnection":
        c.streamManager?.createConnection(request.connectionId)
        result = undefined
        break
      case "stream_closeConnection":
        c.streamManager?.closeConnection(request.connectionId)
        result = undefined
        break
      case "stream_subscribe":
        result = c.streamManager?.subscribe(
          request.connectionId,
          request.channel,
          request.options,
          (message) => {
            proxyEvent("message:send", {
              connectionId: request.connectionId,
              message,
            })
          }
        )
        break
      case "stream_unsubscribe":
        result = c.streamManager?.unsubscribe(request.subscriptionId)
        break
      case "stream_getSubscriptions": {
        const subs = c.streamManager?.getSubscriptions(request.connectionId) ?? []
        // Return a structured-cloneable view (omit callback functions)
        result = subs.map(({ id, channel, options, active, lastActivity }) => ({
          id,
          channel,
          options,
          active,
          lastActivity,
        }))
        break
      }
      case "stream_getChannels":
        result = c.streamManager?.getAvailableChannels()
        break

      default:
        throw new Error(`Unknown request type: ${JSON.stringify(request)}`)
    }

    self.postMessage(ok(result))
  } catch (error) {
    self.postMessage(fail(error))
  }
}
