import { ServerAPI } from ".."
import type { DockerAdapterOptions } from "@dockstat/typings"

// Action intent types
type AdapterAction =
  | { intent: "client:register"; clientName: string; options?: DockerAdapterOptions }
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
      const defaultTimeout = formData.get("defaultTimeout")
      const retryAttempts = formData.get("retryAttempts")
      const retryDelay = formData.get("retryDelay")
      const enableMonitoring = formData.get("enableMonitoring")
      const enableEventEmitter = formData.get("enableEventEmitter")

      if (defaultTimeout) options.defaultTimeout = Number(defaultTimeout)
      if (retryAttempts) options.retryAttempts = Number(retryAttempts)
      if (retryDelay) options.retryDelay = Number(retryDelay)
      if (enableMonitoring) options.enableMonitoring = enableMonitoring === "true"
      if (enableEventEmitter) options.enableEventEmitter = enableEventEmitter === "true"

      return {
        intent: "client:register",
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
    const [statusRes, clientsRes, clientsWithConfigRes, hostsRes] = await Promise.all([
      ServerAPI.docker.status.get(),
      ServerAPI.docker.client.all({ stored: "true" }).get(),
      ServerAPI.docker.client["all-with-config"].get(),
      ServerAPI.docker.hosts.get(),
    ])

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

    const status = statusRes.status === 200 ? statusRes.data : emptyStatus
    const clients = clientsRes.status === 200 ? clientsRes.data : []
    const clientsWithConfig = clientsWithConfigRes.status === 200 ? clientsWithConfigRes.data : []
    const hosts = hostsRes.status === 200 ? hostsRes.data : []
    return { status, clients, clientsWithConfig, hosts }
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

          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message: `Client "${action.clientName}" registered`,
            }
          }

          const errorMsg =
            res.status === 400 && res.data ? res.data.message : "Failed to register client"
          return { success: false, error: errorMsg }
        }

        case "client:delete": {
          const res = await ServerAPI.docker.client.delete.delete({
            clientId: action.clientId,
          })

          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message: `Client ${action.clientId} deleted`,
            }
          }

          return { success: false, error: "Failed to delete client" }
        }

        case "client:monitoring:toggle": {
          const res = await ServerAPI.docker.client
            .monitoring({ clientId: action.clientId })
            .toggle.post()

          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message: `Monitoring toggled for client ${action.clientId}`,
            }
          }

          return { success: false, error: JSON.stringify(res.error) }
        }

        case "host:add": {
          const res = await ServerAPI.docker.hosts.add.post({
            clientId: action.clientId,
            hostname: action.hostname,
            name: action.name,
            secure: action.secure,
            port: action.port,
          })

          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message: `Host "${action.name}" added`,
            }
          }

          return { success: false, error: "Failed to add host" }
        }

        case "host:update": {
          const res = await ServerAPI.docker.hosts.update.post({
            clientId: action.clientId,
            host: action.host,
          })

          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message: `Host "${action.host.name}" updated`,
            }
          }

          return { success: false, error: "Failed to update host" }
        }

        default:
          return { success: false, error: "Unknown action" }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      return { success: false, error: message }
    }
  },
}

export type { AdapterAction, ActionResponse }
