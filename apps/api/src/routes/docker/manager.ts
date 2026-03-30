import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerManager = new Elysia({
  prefix: "/manager",
  detail: {
    tags: ["Docker Manager"],
    description:
      "Docker worker pool management endpoints for monitoring and controlling Docker client connections",
  },
})
  .get(
    "/pool-stats",
    async ({ status }) => {
      try {
        const res = await DCM.getPoolMetrics()
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Could not get Pool Stats")
        return status(400, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Get Worker Pool Statistics",
        description:
          "Retrieves detailed metrics about the Docker worker pool including worker counts, memory usage, and connection status. This endpoint provides real-time statistics about the Docker client manager's worker threads, their health, and the hosts they manage.",
        responses: {
          200: {
            description: "Successfully retrieved pool statistics",
          },
          400: {
            description: "Failed to retrieve pool statistics due to an error",
          },
        },
      },
      response: {
        200: DockerModel.poolStatus,
        400: DockerModel.error,
      },
    }
  )
  .post(
    "/init-all-clients",
    async ({ status }) => {
      try {
        const allClients = DCM.getAllClients()
        for (const c of allClients) {
          DCM.init(c.id)
        }
        return status(200, DCM.getAllClients(true))
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Could not initialize clients")
        return status(400, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Initialize All Docker Clients",
        description:
          "Initializes all registered Docker clients, creating worker threads for each client. This operation establishes connections to all configured Docker hosts and starts monitoring. Use this endpoint after registering new clients or to reinitialize existing connections.",
        responses: {
          200: {
            description: "Successfully initialized all clients",
          },
          400: {
            description: "Failed to initialize one or more clients",
          },
        },
      },
      response: {
        200: t.Object({
          description: t.String({
            examples: ["Successfully initialized all clients", "3 clients initialized"],
          }),
          data: DockerModel.initAllClientsRes,
        }),
        400: DockerModel.error,
      },
    }
  )
