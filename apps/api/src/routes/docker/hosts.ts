import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerHostElysia = new Elysia({
  prefix: "/hosts",
  detail: {
    tags: ["Docker Host Management"],
    description:
      "Docker host management endpoints for adding, updating, and removing Docker daemon connections",
  },
})
  .get("/", async ({ status }) => status(200, await DCM.getAllHosts()), {
    detail: {
      summary: "List All Docker Hosts",
      description:
        "Retrieves all configured Docker hosts across all clients. Returns a list of hosts with their connection status, reachability information, and associated client IDs. This endpoint is useful for monitoring the status of all Docker connections in the system.",
      responses: {
        200: {
          description: "Successfully retrieved all Docker hosts",
        },
      },
    },
    response: {
      200: DockerModel.allHosts,
    },
  })
  .get("/:clientId", async ({ params: { clientId } }) => await DCM.getAllHostMetrics(clientId), {
    detail: {
      summary: "Get Host Metrics for Client",
      description:
        "Retrieves detailed metrics for all hosts associated with a specific Docker client. This includes connection statistics, latency measurements, and operational status for each host. Metrics are useful for monitoring health and performance of Docker daemon connections.",
      parameters: {
        clientId: {
          description: "The unique identifier of the Docker client",
          example: 1,
        },
      },
      responses: {
        200: {
          description: "Successfully retrieved host metrics for the specified client",
        },
        404: {
          description: "Client not found",
        },
      },
    },
    params: t.Object({
      clientId: t.Number({
        description: "The unique identifier of the Docker client",
        examples: [1, 2, 3],
      }),
    }),
  })
  .post(
    "/",
    async ({ body, status }) => {
      try {
        const host = await DCM.addHost(
          body.clientId,
          body.hostname,
          body.name,
          body.secure,
          body.port
        )
        return status(200, {
          success: true as const,
          message: `Host "${body.name}" added successfully`,
          data: host,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to add host")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Add Docker Host",
        description:
          "Registers a new Docker host with an existing client. The host can be either a local Docker daemon (via Unix socket) or a remote Docker daemon (via TCP). Remote connections can be secured using TLS certificates.",
        requestBody: {
          description: "Configuration for the new Docker host",
          required: true,
          content: {
            "application/json": {
              schema: DockerModel.addHostBody,
              example: {
                clientId: 1,
                hostname: "docker.local",
                name: "Local Docker Host",
                secure: false,
                port: 2375,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully added the Docker host",
          },
          500: {
            description: "Failed to add host due to server error",
          },
        },
      },
      body: DockerModel.addHostBody,
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ['Host "Local Docker Host" added successfully'],
          }),
          data: t.Object({
            id: t.Number({ examples: [1, 2, 3] }),
            name: t.String({ examples: ["Local Docker Host"] }),
            host: t.String({ examples: ["docker.local", "192.168.1.100"] }),
            port: t.Number({ examples: [2375, 2376] }),
            secure: t.Boolean({ examples: [true, false] }),
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: ["Connection refused", "Invalid credentials", "Host already exists"],
          }),
        }),
      },
    }
  )
  .patch(
    "/",
    async ({ body: { clientId, host }, status }) => {
      try {
        const updatedHost = await DCM.updateHost(clientId, {
          ...host,
          docker_client_id: clientId,
        })
        return status(200, {
          success: true as const,
          message: `Host "${host.name}" updated successfully`,
          data: updatedHost,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to update host")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Update Docker Host",
        description:
          "Updates configuration for an existing Docker host. You can modify the hostname, port, security settings, or display name. This operation will test the new connection configuration before applying changes.",
        requestBody: {
          description: "Updated configuration for the Docker host",
          required: true,
          content: {
            "application/json": {
              schema: DockerModel.updateBody,
              example: {
                clientId: 1,
                host: {
                  id: 1,
                  host: "docker.example.com",
                  name: "Production Docker",
                  secure: true,
                  port: 2376,
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully updated the Docker host configuration",
          },
          500: {
            description: "Failed to update host due to server error",
          },
        },
      },
      body: DockerModel.updateBody,
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ['Host "Production Docker" updated successfully'],
          }),
          data: t.Object({
            id: t.Number(),
            name: t.String(),
            host: t.String(),
            port: t.Number(),
            secure: t.Boolean(),
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: ["Host not found", "Connection test failed", "Invalid configuration"],
          }),
        }),
      },
    }
  )
  .delete(
    "/",
    async ({ body: { clientId, hostId }, status }) => {
      try {
        await DCM.removeHost(clientId, hostId)
        return status(200, {
          success: true as const,
          message: `Host with id "${hostId}" on Client "${clientId}" deleted successfully`,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to delete host")
        return status(500, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Delete Docker Host",
        description:
          "Removes a Docker host from the system. This operation will disconnect any active connections and stop monitoring the host. The host configuration is permanently deleted. Any containers managed by this host will no longer be tracked.",
        requestBody: {
          description: "Identifiers for the client and host to delete",
          required: true,
          content: {
            "application/json": {
              schema: t.Object({
                clientId: t.Number(),
                hostId: t.Number(),
              }),
              example: {
                clientId: 1,
                hostId: 3,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully deleted the Docker host",
          },
          500: {
            description: "Failed to delete host due to server error",
          },
        },
      },
      body: t.Object({
        clientId: t.Number({
          description: "The unique identifier of the Docker client",
          examples: [1, 2, 3],
        }),
        hostId: t.Number({
          description: "The unique identifier of the host to delete",
          examples: [1, 2, 3],
        }),
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String({
            examples: ['Host with id "3" on Client "1" deleted successfully'],
          }),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String({
            examples: ["Host not found", "Failed to disconnect", "Active monitoring in progress"],
          }),
        }),
      },
    }
  )
