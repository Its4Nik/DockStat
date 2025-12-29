import type { DockerAdapterOptions } from "@dockstat/typings"
import { handleElysiaError } from "@dockstat/utils"
import { ServerAPI } from ".."

// Action intent types
type AdapterAction =
  | { intent: "client:register"; clientName: string; options?: DockerAdapterOptions }
  | {
      intent: "client:update"
      clientId: number
      clientName: string
      options?: DockerAdapterOptions
    }
  | { intent: "client:delete"; clientId: number }
  | { intent: "client:monitoring:toggle"; clientId: number }
  | {
      intent: "host:add"
      clientId: number
      hostname: string
      name: string
      secure: boolean
      port: number
    }
  | {
      intent: "host:update"
      clientId: number
      host: {
        id: number
        host: string
        name: string
        secure: boolean
        port: number
      }
    }
  | {
      intent: "host:delete"
      clientId: number
      hostId: number
    }
  | {
      intent: "client:monitoring:create-manager"
      clientId: number
    }

// Response types
interface ActionSuccess<T = unknown> {
  success: true
  data?: T
  message?: string
}

interface ActionError {
  success: false
  error: string
}

type ActionResponse<T = unknown> = ActionSuccess<T> | ActionError

// Parse form data into typed action
function parseFormData(formData: FormData): AdapterAction | null {
  const intent = formData.get("intent")?.toString()

  switch (intent) {
    case "client:register": {
      const clientName = formData.get("clientName")?.toString()
      if (!clientName) return null

      const options: DockerAdapterOptions = {}

      // Basic client options
      const defaultTimeout = formData.get("defaultTimeout")
      const retryAttempts = formData.get("retryAttempts")
      const retryDelay = formData.get("retryDelay")
      const enableMonitoring = formData.get("enableMonitoring")
      const enableEventEmitter = formData.get("enableEventEmitter")

      if (defaultTimeout && defaultTimeout !== "") options.defaultTimeout = Number(defaultTimeout)
      if (retryAttempts && retryAttempts !== "") options.retryAttempts = Number(retryAttempts)
      if (retryDelay && retryDelay !== "") options.retryDelay = Number(retryDelay)
      if (enableMonitoring) options.enableMonitoring = enableMonitoring === "true"
      if (enableEventEmitter) options.enableEventEmitter = enableEventEmitter === "true"

      // Monitoring options (read early to set top-level enableContainerMetrics)
      const enableContainerMetrics = formData.get("enableContainerMetrics")
      if (enableContainerMetrics === "true") options.enableContainerMetrics = true

      // Monitoring options
      const healthCheckInterval = formData.get("healthCheckInterval")
      const containerEventPollingInterval = formData.get("containerEventPollingInterval")
      const hostMetricsInterval = formData.get("hostMetricsInterval")
      const containerMetricsInterval = formData.get("containerMetricsInterval")
      const enableContainerEvents = formData.get("enableContainerEvents")
      const enableHostMetrics = formData.get("enableHostMetrics")
      const enableHealthChecks = formData.get("enableHealthChecks")
      const monitoringRetryAttempts = formData.get("monitoringRetryAttempts")
      const monitoringRetryDelay = formData.get("monitoringRetryDelay")

      const hasMonitoringOptions =
        (healthCheckInterval && healthCheckInterval !== "") ||
        (containerEventPollingInterval && containerEventPollingInterval !== "") ||
        (hostMetricsInterval && hostMetricsInterval !== "") ||
        (containerMetricsInterval && containerMetricsInterval !== "") ||
        enableContainerEvents === "true" ||
        enableHostMetrics === "true" ||
        enableContainerMetrics === "true" ||
        enableHealthChecks === "true" ||
        (monitoringRetryAttempts && monitoringRetryAttempts !== "") ||
        (monitoringRetryDelay && monitoringRetryDelay !== "")

      if (hasMonitoringOptions) {
        options.monitoringOptions = {}
        if (healthCheckInterval && healthCheckInterval !== "")
          options.monitoringOptions.healthCheckInterval = Number(healthCheckInterval)
        if (containerEventPollingInterval && containerEventPollingInterval !== "")
          options.monitoringOptions.containerEventPollingInterval = Number(
            containerEventPollingInterval
          )
        if (hostMetricsInterval && hostMetricsInterval !== "")
          options.monitoringOptions.hostMetricsInterval = Number(hostMetricsInterval)
        if (containerMetricsInterval && containerMetricsInterval !== "")
          options.monitoringOptions.containerMetricsInterval = Number(containerMetricsInterval)
        if (enableContainerEvents === "true") options.monitoringOptions.enableContainerEvents = true
        if (enableHostMetrics === "true") options.monitoringOptions.enableHostMetrics = true
        if (enableContainerMetrics === "true")
          options.monitoringOptions.enableContainerMetrics = true
        if (enableHealthChecks === "true") options.monitoringOptions.enableHealthChecks = true
        if (monitoringRetryAttempts && monitoringRetryAttempts !== "")
          options.monitoringOptions.retryAttempts = Number(monitoringRetryAttempts)
        if (monitoringRetryDelay && monitoringRetryDelay !== "")
          options.monitoringOptions.retryDelay = Number(monitoringRetryDelay)
      }

      // Exec options
      const workingDir = formData.get("workingDir")?.toString()
      const execEnv = formData.get("execEnv")?.toString()
      const tty = formData.get("tty")

      const hasExecOptions =
        (workingDir && workingDir !== "") || (execEnv && execEnv !== "") || tty === "true"

      if (hasExecOptions) {
        options.execOptions = {}
        if (workingDir && workingDir !== "") options.execOptions.workingDir = workingDir
        if (execEnv && execEnv !== "")
          options.execOptions.env = execEnv.split(",").map((e) => e.trim())
        if (tty === "true") options.execOptions.tty = true
      }

      return {
        intent: "client:register",
        clientName,
        options: Object.keys(options).length > 0 ? options : undefined,
      }
    }

    case "client:update": {
      const clientId = formData.get("clientId")
      const clientName = formData.get("clientName")?.toString()
      if (!clientId || !clientName) return null

      const options: DockerAdapterOptions = {}

      // Basic client options
      const defaultTimeout = formData.get("defaultTimeout")
      const retryAttempts = formData.get("retryAttempts")
      const retryDelay = formData.get("retryDelay")
      const enableMonitoring = formData.get("enableMonitoring")
      const enableEventEmitter = formData.get("enableEventEmitter")

      if (defaultTimeout && defaultTimeout !== "") options.defaultTimeout = Number(defaultTimeout)
      if (retryAttempts && retryAttempts !== "") options.retryAttempts = Number(retryAttempts)
      if (retryDelay && retryDelay !== "") options.retryDelay = Number(retryDelay)
      if (enableMonitoring) options.enableMonitoring = enableMonitoring === "true"
      if (enableEventEmitter) options.enableEventEmitter = enableEventEmitter === "true"

      // Monitoring options (read early to set top-level enableContainerMetrics)
      const enableContainerMetrics = formData.get("enableContainerMetrics")
      if (enableContainerMetrics === "true") options.enableContainerMetrics = true

      // Monitoring options
      const healthCheckInterval = formData.get("healthCheckInterval")
      const containerEventPollingInterval = formData.get("containerEventPollingInterval")
      const hostMetricsInterval = formData.get("hostMetricsInterval")
      const containerMetricsInterval = formData.get("containerMetricsInterval")
      const enableContainerEvents = formData.get("enableContainerEvents")
      const enableHostMetrics = formData.get("enableHostMetrics")
      const enableHealthChecks = formData.get("enableHealthChecks")
      const monitoringRetryAttempts = formData.get("monitoringRetryAttempts")
      const monitoringRetryDelay = formData.get("monitoringRetryDelay")

      const hasMonitoringOptions =
        (healthCheckInterval && healthCheckInterval !== "") ||
        (containerEventPollingInterval && containerEventPollingInterval !== "") ||
        (hostMetricsInterval && hostMetricsInterval !== "") ||
        (containerMetricsInterval && containerMetricsInterval !== "") ||
        enableContainerEvents === "true" ||
        enableHostMetrics === "true" ||
        enableContainerMetrics === "true" ||
        enableHealthChecks === "true" ||
        (monitoringRetryAttempts && monitoringRetryAttempts !== "") ||
        (monitoringRetryDelay && monitoringRetryDelay !== "")

      if (hasMonitoringOptions) {
        options.monitoringOptions = {}
        if (healthCheckInterval && healthCheckInterval !== "")
          options.monitoringOptions.healthCheckInterval = Number(healthCheckInterval)
        if (containerEventPollingInterval && containerEventPollingInterval !== "")
          options.monitoringOptions.containerEventPollingInterval = Number(
            containerEventPollingInterval
          )
        if (hostMetricsInterval && hostMetricsInterval !== "")
          options.monitoringOptions.hostMetricsInterval = Number(hostMetricsInterval)
        if (containerMetricsInterval && containerMetricsInterval !== "")
          options.monitoringOptions.containerMetricsInterval = Number(containerMetricsInterval)
        if (enableContainerEvents === "true") options.monitoringOptions.enableContainerEvents = true
        if (enableHostMetrics === "true") options.monitoringOptions.enableHostMetrics = true
        if (enableContainerMetrics === "true")
          options.monitoringOptions.enableContainerMetrics = true
        if (enableHealthChecks === "true") options.monitoringOptions.enableHealthChecks = true
        if (monitoringRetryAttempts && monitoringRetryAttempts !== "")
          options.monitoringOptions.retryAttempts = Number(monitoringRetryAttempts)
        if (monitoringRetryDelay && monitoringRetryDelay !== "")
          options.monitoringOptions.retryDelay = Number(monitoringRetryDelay)
      }

      // Exec options
      const workingDir = formData.get("workingDir")?.toString()
      const execEnv = formData.get("execEnv")?.toString()
      const tty = formData.get("tty")

      const hasExecOptions =
        (workingDir && workingDir !== "") || (execEnv && execEnv !== "") || tty === "true"

      if (hasExecOptions) {
        options.execOptions = {}
        if (workingDir && workingDir !== "") options.execOptions.workingDir = workingDir
        if (execEnv && execEnv !== "")
          options.execOptions.env = execEnv.split(",").map((e) => e.trim())
        if (tty === "true") options.execOptions.tty = true
      }

      return {
        intent: "client:update",
        clientId: Number(clientId),
        clientName,
        options: Object.keys(options).length > 0 ? options : undefined,
      }
    }

    case "client:delete": {
      const clientId = formData.get("clientId")
      if (!clientId) return null
      return { intent: "client:delete", clientId: Number(clientId) }
    }

    case "client:monitoring:toggle": {
      const clientId = formData.get("clientId")
      if (!clientId) return null
      return { intent: "client:monitoring:toggle", clientId: Number(clientId) }
    }

    case "client:monitoring:create-manager": {
      const clientId = formData.get("clientId")
      if (!clientId) return null
      return { intent: "client:monitoring:create-manager", clientId: Number(clientId) }
    }

    case "host:add": {
      const clientId = formData.get("clientId")
      const hostname = formData.get("hostname")?.toString()
      const name = formData.get("name")?.toString()
      const secure = formData.get("secure")
      const port = formData.get("port")

      if (!clientId || !hostname || !name || port === null) return null

      return {
        intent: "host:add",
        clientId: Number(clientId),
        hostname,
        name,
        secure: secure === "true",
        port: Number(port),
      }
    }

    case "host:delete": {
      const hostId = formData.get("hostId")
      const clientId = formData.get("clientId")

      return {
        intent: "host:delete",
        clientId: Number(clientId),
        hostId: Number(hostId),
      }
    }

    case "host:update": {
      const clientId = formData.get("clientId")
      const hostId = formData.get("hostId")
      const host = formData.get("host")?.toString()
      const name = formData.get("name")?.toString()
      const secure = formData.get("secure")
      const port = formData.get("port")

      if (!clientId || !hostId || !host || !name || port === null) return null

      return {
        intent: "host:update",
        clientId: Number(clientId),
        host: {
          id: Number(hostId),
          host,
          name,
          secure: secure === "true",
          port: Number(port),
        },
      }
    }

    default:
      return null
  }
}

export const Adapter = {
  loader: async () => {
    const statusRes = await ServerAPI.docker.status.get()
    const containersRes = await ServerAPI.docker.containers["all-containers"].get()

    // Default empty status
    const emptyStatus = {
      totalWorkers: 0,
      activeWorkers: 0,
      totalHosts: 0,
      totalClients: 0,
      averageHostsPerWorker: 0,
      workers: [],
      hosts: [],
    }

    const defaultContainers = {
      total: 0,
      perHost: [] as Array<{ hostId: number; clientId: number; containerCount: number }>,
    }

    const status = statusRes.status === 200 ? statusRes.data : emptyStatus
    const containers =
      containersRes.status === 200 && containersRes.data ? containersRes.data : defaultContainers

    return { status, containers }
  },

  action: async ({ request }: { request: Request }): Promise<ActionResponse> => {
    try {
      const formData = await request.formData()
      const action = parseFormData(formData)

      if (!action) {
        return { success: false, error: "Invalid action or missing required fields" }
      }

      switch (action.intent) {
        case "client:register": {
          const res = await ServerAPI.docker.client.register.post({
            clientName: action.clientName,
            options: action.options ?? null,
          })

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data,
              message: res.data.message || `Client "${action.clientName}" registered`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to register client"),
          }
        }

        case "client:update": {
          const res = await ServerAPI.docker.client.update.post({
            clientId: action.clientId,
            clientName: action.clientName,
            options: action.options ?? null,
          })

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data,
              message: res.data.message || `Client "${action.clientName}" updated`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to update client"),
          }
        }

        case "client:delete": {
          const res = await ServerAPI.docker.client.delete.delete({
            clientId: action.clientId,
          })

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data,
              message: res.data.message || `Client ${action.clientId} deleted`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to delete client"),
          }
        }

        case "client:monitoring:toggle": {
          const res = await ServerAPI.docker.client
            .monitoring({ clientId: action.clientId })
            .toggle.post()

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data,
              message: res.data.message || `Monitoring toggled for client ${action.clientId}`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to toggle monitoring"),
          }
        }

        case "client:monitoring:create-manager": {
          const res = await ServerAPI.docker.client["create-monitoring-manager"]({
            clientId: action.clientId,
          }).post()

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data,
              message: res.data.message || `Monitoring manager created on ${action.clientId}`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to create monitoring manager"),
          }
        }

        case "host:add": {
          const res = await ServerAPI.docker.hosts.add.post({
            clientId: action.clientId,
            hostname: action.hostname,
            name: action.name,
            secure: action.secure,
            port: action.port,
          })

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data.data,
              message: res.data.message || `Host "${action.name}" added`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to add host"),
          }
        }

        case "host:delete": {
          const res = await ServerAPI.docker.hosts.delete.post({
            clientId: action.clientId,
            hostId: action.hostId,
          })

          if (res.status === 200 && res.data) {
            return {
              success: true,
              message: res.data.message,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to delete host"),
          }
        }

        case "host:update": {
          const res = await ServerAPI.docker.hosts.update.post({
            clientId: action.clientId,
            host: action.host,
          })

          if (res.status === 200 && res.data) {
            return {
              success: true,
              data: res.data.data,
              message: res.data.message || `Host "${action.host.name}" updated`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to update host"),
          }
        }

        default:
          return { success: false, error: "Unknown action" }
      }
    } catch (error) {
      return { success: false, error: handleElysiaError(error, "An unexpected error occurred") }
    }
  },
}

export type { AdapterAction, ActionResponse }
