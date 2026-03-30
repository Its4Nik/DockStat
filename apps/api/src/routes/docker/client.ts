import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

type ClientOperationResult =
  | { success: true; message: string; clientId: number }
  | { success: false; error: unknown; message: string }

export const DockerClientElysia = new Elysia({
  prefix: "/client",
  detail: {
    tags: ["Docker Client Management"],
    description:
      "Docker client management endpoints for registering, updating, and controlling Docker daemon connections. Each client represents a logical grouping of Docker hosts that can be monitored and managed together.",
  },
})
  .post(
    "/",
    async ({ status, body }) => {
      try {
        const res = (await DCM.registerClient(
          body.clientName,
          body.options || undefined
        )) as ClientOperationResult
        if (!res.success) {
          const errorStr = extractErrorMessage(res.error, "Registration failed")
          return status(400, {
            success: false as const,
            error: errorStr,
            message: res.message || "Failed to register client",
          })
        }
        return status(200, {
          success: true as const,
          clientId: Number(res.clientId),
          message: res.message || "Client registered successfully",
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to register client")
        return status(500, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Register Docker Client",
        description:
          "Creates a new Docker client instance for managing Docker daemon connections. A client can manage multiple Docker hosts and provides a unified interface for monitoring and controlling containers across those hosts. Options include Docker daemon configuration, connection timeouts, and TLS settings.",
        requestBody: {
          description: "Client registration configuration",
          required: true,
          content: {
            "application/json": {
              schema: DockerModel.registerClientBody,
              example: {
                clientName: "production",
                options: {
                  host: "docker.example.com",
                  port: 2376,
                  ca: "/path/to/ca.pem",
                  cert: "/path/to/cert.pem",
                  key: "/path/to/key.pem",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully registered Docker client",
          },
          400: {
            description: "Client registration failed due to invalid input or existing client name",
          },
          500: {
            description: "Server error during client registration",
          },
        },
      },
      body: DockerModel.registerClientBody,
      response: {
        200: DockerModel.registerClientSuccess,
        400: DockerModel.error,
        500: DockerModel.error,
      },
    }
  )
  .patch(
    "/",
    async ({ status, body }) => {
      try {
        const res = (await DCM.updateClient(
          body.clientId,
          body.clientName,
          body.options || {}
        )) as ClientOperationResult
        if (!res.success) {
          const errorStr = extractErrorMessage(res.error, "Update failed")
          return status(400, {
            success: false as const,
            error: errorStr,
            message: res.message || "Failed to update client",
          })
        }
        return status(200, {
          success: true as const,
          clientId: Number(res.clientId),
          message: res.message || "Client updated successfully",
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to update client")
        return status(500, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Update Docker Client",
        description:
          "Updates configuration for an existing Docker client. This can include changing the client name, Docker daemon connection settings, TLS certificates, or other adapter options. The client must exist for this operation to succeed.",
        requestBody: {
          description: "Client update configuration",
          required: true,
          content: {
            "application/json": {
              schema: DockerModel.updateClientBody,
              example: {
                clientId: 1,
                clientName: "production-updated",
                options: {
                  host: "docker-updated.example.com",
                  port: 2376,
                  timeout: 30000,
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully updated Docker client configuration",
          },
          400: {
            description: "Client update failed due to invalid input or client not found",
          },
          500: {
            description: "Server error during client update",
          },
        },
      },
      body: DockerModel.updateClientBody,
      response: {
        200: DockerModel.updateClientSuccess,
        400: DockerModel.error,
        500: DockerModel.error,
      },
    }
  )
  .delete(
    "/",
    async ({ body, status }) => {
      try {
        const result = await DCM.removeClient(body.clientId)
        return status(200, {
          success: true as const,
          message: `Client ${body.clientId} deleted successfully`,
          data: result,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to delete client")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Delete Docker Client",
        description:
          "Removes a Docker client from the system, including all its associated hosts, monitoring connections, and resources. This is a destructive operation that cannot be undone. Ensure you have appropriate backups before deleting clients.",
        requestBody: {
          description: "Client identifier to delete",
          required: true,
          content: {
            "application/json": {
              schema: t.Object({ clientId: t.Number() }),
              example: {
                clientId: 1,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully deleted Docker client and all associated resources",
          },
          500: {
            description: "Server error during client deletion",
          },
        },
      },
      body: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to delete",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ["Client 1 deleted successfully", "Client 2 deleted successfully"],
          }),
          data: t.Any(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: ["Client not found", "Failed to remove hosts", "Failed to stop monitoring"],
          }),
        }),
      },
    }
  )
  .get("/all/:stored", ({ params }) => DCM.getAllClients(params.stored), {
    detail: {
      summary: "List All Docker Clients",
      description:
        "Retrieves all registered Docker clients. The `stored` parameter controls whether to return all registered clients from database or only currently active clients in memory. Useful for monitoring system state and managing client lifecycle.",
      parameters: {
        stored: {
          description:
            "If true, returns all clients from database. If false, returns only currently active clients.",
          type: "boolean",
          default: false,
        },
      },
      responses: {
        200: {
          description: "Successfully retrieved list of Docker clients",
        },
      },
    },
    params: t.Object({
      stored: t.Boolean({
        default: false,
        description: "Whether to return all stored clients or only active ones",
        examples: [true, false],
      }),
    }),
  })
  .post(
    "/monitoring/:clientId/start",
    async ({ params, status }) => {
      try {
        await DCM.startMonitoring(params.clientId)
        return status(200, {
          success: true as const,
          message: "Monitoring started",
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to start monitoring")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Start Client Monitoring",
        description:
          "Starts real-time monitoring for a Docker client and all its associated hosts. This enables container statistics streaming, event notifications, and health checks. Monitoring runs in background worker threads and updates continuously.",
        parameters: {
          clientId: {
            description: "The unique identifier of the Docker client",
            type: "number",
          },
        },
        responses: {
          200: {
            description: "Successfully started monitoring for the client",
          },
          500: {
            description: "Failed to start monitoring due to server error",
          },
        },
      },
      params: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to start monitoring",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ["Monitoring started", "Monitoring activated"],
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: [
              "Client not found",
              "Monitoring already active",
              "Failed to initialize workers",
            ],
          }),
        }),
      },
    }
  )
  .post(
    "/monitoring/:clientId/stop",
    async ({ params, status }) => {
      try {
        await DCM.stopMonitoring(params.clientId)
        return status(200, {
          success: true as const,
          message: "Monitoring stopped",
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to stop monitoring")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Stop Client Monitoring",
        description:
          "Stops real-time monitoring for a Docker client. This halts container statistics streaming, event notifications, and health checks. Worker threads for monitoring will be terminated and resources will be released. This operation does not remove the client or its hosts.",
        parameters: {
          clientId: {
            description: "The unique identifier of the Docker client",
            type: "number",
          },
        },
        responses: {
          200: {
            description: "Successfully stopped monitoring for the client",
          },
          500: {
            description: "Failed to stop monitoring due to server error",
          },
        },
      },
      params: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to stop monitoring",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ["Monitoring stopped", "Monitoring deactivated"],
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: ["Client not found", "Monitoring not active", "Failed to terminate workers"],
          }),
        }),
      },
    }
  )
  .post(
    "/monitoring/:clientId/toggle",
    async ({ params, status }) => {
      try {
        const isMonitoring = await DCM.isMonitoring(params.clientId)
        if (isMonitoring) {
          await DCM.stopMonitoring(params.clientId)
          return status(200, {
            success: true as const,
            message: "Monitoring stopped",
            isMonitoring: false,
          })
        }
        await DCM.startMonitoring(params.clientId)
        return status(200, {
          success: true as const,
          message: "Monitoring started",
          isMonitoring: true,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to toggle monitoring")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Toggle Client Monitoring",
        description:
          "Toggles monitoring state for a Docker client. If monitoring is active, it will be stopped. If monitoring is inactive, it will be started. Returns the new monitoring state in the response. Useful for quick enable/disable of monitoring without needing to check current state first.",
        parameters: {
          clientId: {
            description: "The unique identifier of the Docker client",
            type: "number",
          },
        },
        responses: {
          200: {
            description: "Successfully toggled monitoring state",
          },
          500: {
            description: "Failed to toggle monitoring due to server error",
          },
        },
      },
      params: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to toggle monitoring",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ["Monitoring started", "Monitoring stopped"],
          }),
          isMonitoring: t.Boolean({
            description: "The new monitoring state after toggle",
            examples: [true, false],
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: [
              "Client not found",
              "Failed to start monitoring",
              "Failed to stop monitoring",
            ],
          }),
        }),
      },
    }
  )
  .post(
    "/create-monitoring-manager/:clientId",
    async ({ params, status }) => {
      try {
        await DCM.createMonitoringManager(params.clientId)
        return status(200, {
          success: true as const,
          message: "Monitoring manager created",
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to create monitoring manager")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Create Monitoring Manager",
        description:
          "Creates a monitoring manager instance for a Docker client. The monitoring manager handles the lifecycle of monitoring tasks, coordinates worker threads, and manages resource allocation for real-time data collection. Use this endpoint to initialize monitoring infrastructure for a client before starting actual monitoring.",
        parameters: {
          clientId: {
            description: "The unique identifier of the Docker client",
            type: "number",
          },
        },
        responses: {
          200: {
            description: "Successfully created monitoring manager for the client",
          },
          500: {
            description: "Failed to create monitoring manager due to server error",
          },
        },
      },
      params: t.Object({
        clientId: t.Number({
          description:
            "The unique identifier of the Docker client to create monitoring manager for",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ["Monitoring manager created", "Manager initialized"],
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: [
              "Client not found",
              "Manager already exists",
              "Failed to initialize manager",
            ],
          }),
        }),
      },
    }
  )
