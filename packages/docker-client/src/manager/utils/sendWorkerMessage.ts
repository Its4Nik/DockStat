import { http } from "@dockstat/utils"
import type { Worker } from "bun"
import type { WorkerRequest, WorkerResponse } from "../../shared/types"
import { VALID_REQUEST_TYPES } from "./consts"

export function sendWorkerMessage(
  worker: Worker,
  request: Omit<WorkerRequest, "requestId">,
  timeout = 30000
): Promise<WorkerResponse> {
  const requestId = http.requestId.getRequestID()
  const message = { ...request, requestId } as WorkerRequest

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.removeEventListener("message", handler)
      worker.removeEventListener("error", errorHandler)

      resolve({
        error: `Worker request timed out: ${request.type}`,
        requestId,
        success: false,
      })
    }, timeout)

    const handler = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.requestId === requestId) {
        clearTimeout(timer)
        worker.removeEventListener("message", handler)
        worker.removeEventListener("error", errorHandler)

        // Pass through the worker's response (whether success or error)
        resolve(event.data)
      }
    }

    const errorHandler = (err: ErrorEvent) => {
      clearTimeout(timer)
      worker.removeEventListener("message", handler)
      worker.removeEventListener("error", errorHandler)

      resolve({
        error: `Worker crashed: ${err.message}`,
        requestId,
        success: false,
      })
    }

    worker.addEventListener("message", handler)
    worker.addEventListener("error", errorHandler)
    worker.postMessage(message)
  })
}

export function isValidWorkerRequest(message: unknown): message is WorkerRequest {
  if (typeof message !== "object" || message === null) return false

  const msg = message as Record<string, unknown>

  if (typeof msg.type !== "string") return false
  if (
    !VALID_REQUEST_TYPES.has(
      msg.type as typeof VALID_REQUEST_TYPES extends Set<infer T> ? T : never
    )
  )
    return false

  if (msg.requestId !== undefined && typeof msg.requestId !== "string") return false

  // Validate required fields for specific types
  switch (msg.type) {
    case "init":
      return Array.isArray(msg.hosts)
    case "addHost":
      return typeof msg.data === "object" && msg.data !== null
    case "removeHost":
    case "getContainersForHost":
    case "getContainerStatsForHost":
    case "getHostMetrics":
    case "checkHostHealth":
    case "getImages":
    case "getNetworks":
    case "getVolumes":
    case "getSystemInfo":
    case "getSystemVersion":
    case "getDiskUsage":
    case "pruneSystem":
      return typeof msg.hostId === "number"
    case "updateHost":
      return typeof msg.host === "object" && msg.host !== null
    case "getContainer":
    case "getContainerStats":
    case "startContainer":
    case "stopContainer":
    case "restartContainer":
    case "removeContainer":
    case "pauseContainer":
    case "unpauseContainer":
    case "killContainer":
    case "getContainerLogs":
    case "execInContainer":
      return typeof msg.hostId === "number" && typeof msg.containerId === "string"
    case "renameContainer":
      return (
        typeof msg.hostId === "number" &&
        typeof msg.containerId === "string" &&
        typeof msg.newName === "string"
      )
    case "pullImage":
      return typeof msg.hostId === "number" && typeof msg.imageName === "string"
    default:
      return true
  }
}
