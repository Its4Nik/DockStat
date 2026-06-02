import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerHostElysia = new Elysia({
  detail: {
    description:
      "Docker host management endpoints for adding, updating, and removing Docker daemon connections",
    tags: ["Docker Host Management"],
  },
  prefix: "/hosts",
})
  .get("/", async ({ status }) => status(200, await DCM.getAllHosts()), {
    detail: {
      description:
        "Retrieves all configured Docker hosts across all clients. Returns a list of hosts with their connection status, reachability information, and associated client IDs. This endpoint is useful for monitoring the status of all Docker connections in the system.",
      responses: {
        200: {
          description: "Successfully retrieved all Docker hosts",
        },
      },
      summary: "List All Docker Hosts",
    },
    response: {
      200: DockerModel.allHosts,
    },
  })
  .get("/:clientId", async ({ params: { clientId } }) => await DCM.getAllHostMetrics(clientId), {
    detail: {
      description:
        "Retrieves detailed metrics for all hosts associated with a specific Docker client. This includes connection statistics, latency measurements, and operational status for each host. Metrics are useful for monitoring health and performance of Docker daemon connections.",
      responses: {
        200: {
          description: "Successfully retrieved host metrics for the specified client",
        },
        404: {
          description: "Client not found",
        },
      },
      summary: "Get Host Metrics for Client",
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
          data: { ...host, id: Number(host.id) },
          message: `Host "${body.name}" added successfully`,
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to add host")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: DockerModel.addHostBody,
      detail: {
        description:
          "Registers a new Docker host with an existing client. The host can be either a local Docker daemon (via Unix socket) or a remote Docker daemon (via TCP). Remote connections can be secured using TLS certificates.",
        responses: {
          200: {
            description: "Successfully added the Docker host",
          },
          500: {
            description: "Failed to add host due to server error",
          },
        },
        summary: "Add Docker Host",
      },
      response: {
        200: t.Object({
          data: t.Object({
            host: t.String({ examples: ["docker.local", "192.168.1.100"] }),
            id: t.Number({ examples: [1, 2, 3] }),
            name: t.String({ examples: ["Local Docker Host"] }),
            port: t.Number({ examples: [2375, 2376] }),
            secure: t.Boolean({ examples: [true, false] }),
          }),
          message: t.String({
            examples: ['Host "Local Docker Host" added successfully'],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: ["Connection refused", "Invalid credentials", "Host already exists"],
          }),
          success: t.Literal(false),
        }),
      },
    }
  )
  .patch(
    "/",
    async ({ body: { clientId, host }, status }) => {
      try {
        await DCM.updateHost(clientId, {
          ...host,
          docker_client_id: clientId,
        })
        return status(200, {
          data: host,
          message: `Host "${host.name}" updated successfully`,
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to update host")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: DockerModel.updateBody,
      detail: {
        description:
          "Updates configuration for an existing Docker host. You can modify the hostname, port, security settings, or display name. This operation will test the new connection configuration before applying changes.",
        responses: {
          200: {
            description: "Successfully updated the Docker host configuration",
          },
          500: {
            description: "Failed to update host due to server error",
          },
        },
        summary: "Update Docker Host",
      },
      response: {
        200: t.Object({
          data: t.Object({
            host: t.String(),
            id: t.Number(),
            name: t.String(),
            port: t.Number(),
            secure: t.Boolean(),
          }),
          message: t.String({
            examples: ['Host "Production Docker" updated successfully'],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: ["Host not found", "Connection test failed", "Invalid configuration"],
          }),
          success: t.Literal(false),
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
          message: `Host with id "${hostId}" on Client "${clientId}" deleted successfully`,
          success: true as const,
        })
      } catch (err) {
        const errorMessage = extractErrorMessage(err, "Failed to delete host")
        return status(500, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
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
      detail: {
        description:
          "Removes a Docker host from the system. This operation will disconnect any active connections and stop monitoring the host. The host configuration is permanently deleted. Any containers managed by this host will no longer be tracked.",
        responses: {
          200: {
            description: "Successfully deleted the Docker host",
          },
          500: {
            description: "Failed to delete host due to server error",
          },
        },
        summary: "Delete Docker Host",
      },
      response: {
        200: t.Object({
          message: t.String({
            examples: ['Host with id "3" on Client "1" deleted successfully'],
          }),
          success: t.Literal(true),
        }),
        500: t.Object({
          error: t.String({
            examples: ["Host not found", "Failed to disconnect", "Active monitoring in progress"],
          }),
          success: t.Literal(false),
        }),
      },
    }
  )
