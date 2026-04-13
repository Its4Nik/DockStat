import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerManager = new Elysia({
  detail: {
    description:
      "Docker worker pool management endpoints for monitoring and controlling Docker client connections",
    tags: ["Docker Manager"],
  },
  prefix: "/manager",
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
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
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
        summary: "Get Worker Pool Statistics",
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
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
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
        summary: "Initialize All Docker Clients",
      },
      response: {
        200: t.Object({
          data: DockerModel.initAllClientsRes,
          description: t.String({
            examples: ["Successfully initialized all clients", "3 clients initialized"],
          }),
        }),
        400: DockerModel.error,
      },
    }
  )
