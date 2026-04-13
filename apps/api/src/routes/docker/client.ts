import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

type ClientOperationResult =
  | { success: true; message: string; clientId: number }
  | { success: false; error: unknown; message: string }

export const DockerClientElysia = new Elysia({
  detail: {
    description:
      "Docker client management endpoints for registering, updating, and controlling Docker daemon connections. Each client represents a logical grouping of Docker hosts that can be monitored and managed together.",
    tags: ["Docker Client Management"],
  },
  prefix: "/client",
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
            error: errorStr,
            message: res.message || "Failed to register client",
            success: false as const,
          })
        }
        return status(200, {
          clientId: Number(res.clientId),
          message: res.message || "Client registered successfully",
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to register client")
        return status(500, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: DockerModel.registerClientBody,
      detail: {
        description:
          "Creates a new Docker client instance for managing Docker daemon connections. A client can manage multiple Docker hosts and provides a unified interface for monitoring and controlling containers across those hosts. Options include Docker daemon configuration, connection timeouts, and TLS settings.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                clientName: "production",
                options: {
                  ca: "/path/to/ca.pem",
                  cert: "/path/to/cert.pem",
                  host: "docker.example.com",
                  key: "/path/to/key.pem",
                  port: 2376,
                },
              },
              schema: DockerModel.registerClientBody,
            },
          },
          description: "Client registration configuration",
          required: true,
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
        summary: "Register Docker Client",
      },
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
            error: errorStr,
            message: res.message || "Failed to update client",
            success: false as const,
          })
        }
        return status(200, {
          clientId: Number(res.clientId),
          message: res.message || "Client updated successfully",
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to update client")
        return status(500, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: DockerModel.updateClientBody,
      detail: {
        description:
          "Updates configuration for an existing Docker client. This can include changing the client name, Docker daemon connection settings, TLS certificates, or other adapter options. The client must exist for this operation to succeed.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                clientId: 1,
                clientName: "production-updated",
                options: {
                  host: "docker-updated.example.com",
                  port: 2376,
                  timeout: 30000,
                },
              },
              schema: DockerModel.updateClientBody,
            },
          },
          description: "Client update configuration",
          required: true,
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
        summary: "Update Docker Client",
      },
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
          data: result,
          message: `Client ${body.clientId} deleted successfully`,
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to delete client")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to delete",
          examples: [1, 2, 3],
        }),
      }),
      detail: {
        description:
          "Removes a Docker client from the system, including all its associated hosts, monitoring connections, and resources. This is a destructive operation that cannot be undone. Ensure you have appropriate backups before deleting clients.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                clientId: 1,
              },
              schema: t.Object({ clientId: t.Number() }),
            },
          },
          description: "Client identifier to delete",
          required: true,
        },
        responses: {
          200: {
            description: "Successfully deleted Docker client and all associated resources",
          },
          500: {
            description: "Server error during client deletion",
          },
        },
        summary: "Delete Docker Client",
      },
      response: {
        200: t.Object({
          data: t.Any(),
          message: t.String({
            examples: ["Client 1 deleted successfully", "Client 2 deleted successfully"],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: ["Client not found", "Failed to remove hosts", "Failed to stop monitoring"],
          }),
          success: t.Literal(false),
        }),
      },
    }
  )
  .get("/all/:stored", ({ params }) => DCM.getAllClients(params.stored), {
    detail: {
      description:
        "Retrieves all registered Docker clients. The `stored` parameter controls whether to return all registered clients from database or only currently active clients in memory. Useful for monitoring system state and managing client lifecycle.",
      parameters: {
        stored: {
          default: false,
          description:
            "If true, returns all clients from database. If false, returns only currently active clients.",
          type: "boolean",
        },
      },
      responses: {
        200: {
          description: "Successfully retrieved list of Docker clients",
        },
      },
      summary: "List All Docker Clients",
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
          message: "Monitoring started",
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to start monitoring")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
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
        summary: "Start Client Monitoring",
      },
      params: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to start monitoring",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          message: t.String({
            examples: ["Monitoring started", "Monitoring activated"],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: [
              "Client not found",
              "Monitoring already active",
              "Failed to initialize workers",
            ],
          }),
          success: t.Literal(false),
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
          message: "Monitoring stopped",
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to stop monitoring")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
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
        summary: "Stop Client Monitoring",
      },
      params: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to stop monitoring",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          message: t.String({
            examples: ["Monitoring stopped", "Monitoring deactivated"],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: ["Client not found", "Monitoring not active", "Failed to terminate workers"],
          }),
          success: t.Literal(false),
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
            isMonitoring: false,
            message: "Monitoring stopped",
            success: true as const,
          })
        }
        await DCM.startMonitoring(params.clientId)
        return status(200, {
          isMonitoring: true,
          message: "Monitoring started",
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to toggle monitoring")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
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
        summary: "Toggle Client Monitoring",
      },
      params: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client to toggle monitoring",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          isMonitoring: t.Boolean({
            description: "The new monitoring state after toggle",
            examples: [true, false],
          }),
          message: t.String({
            examples: ["Monitoring started", "Monitoring stopped"],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: [
              "Client not found",
              "Failed to start monitoring",
              "Failed to stop monitoring",
            ],
          }),
          success: t.Literal(false),
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
          message: "Monitoring manager created",
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to create monitoring manager")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
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
        summary: "Create Monitoring Manager",
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
          message: t.String({
            examples: ["Monitoring manager created", "Manager initialized"],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: [
              "Client not found",
              "Manager already exists",
              "Failed to initialize manager",
            ],
          }),
          success: t.Literal(false),
        }),
      },
    }
  )
