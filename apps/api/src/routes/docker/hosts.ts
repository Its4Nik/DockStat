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
  .get("/", async () => await DCM.getAllHosts(), {
    detail: {
      description: "Retrieves all configured Docker hosts across all clients.",
      summary: "List All Docker Hosts",
    },
    response: { 200: DockerModel.allHosts },
  })
  .get("/:clientId", async ({ params: { clientId } }) => await DCM.getAllHostMetrics(clientId), {
    detail: {
      description:
        "Retrieves detailed metrics for all hosts associated with a specific Docker client.",
      summary: "Get Host Metrics for Client",
    },
    params: t.Object({
      clientId: t.Number({ description: "Docker client ID", examples: [1, 2, 3] }),
    }),
  })
  .post(
    "/",
    async ({ body }) => {
      const host = await DCM.addHost(
        body.clientId,
        body.hostname,
        body.name,
        body.secure,
        body.port
      )
      return {
        data: { ...host, id: Number(host.id) },
        message: `Host "${body.name}" added successfully`,
        success: true as const,
      }
    },
    {
      body: DockerModel.addHostBody,
      detail: {
        description: "Registers a new Docker host with an existing client.",
        summary: "Add Docker Host",
      },
    }
  )
  .patch(
    "/",
    async ({ body: { clientId, host } }) => {
      await DCM.updateHost(clientId, { ...host, docker_client_id: clientId })
      return {
        data: host,
        message: `Host "${host.name}" updated successfully`,
        success: true as const,
      }
    },
    {
      body: DockerModel.updateBody,
      detail: {
        description: "Updates configuration for an existing Docker host.",
        summary: "Update Docker Host",
      },
    }
  )
  .delete(
    "/",
    async ({ body: { clientId, hostId } }) => {
      await DCM.removeHost(clientId, hostId)
      return {
        message: `Host with id "${hostId}" on Client "${clientId}" deleted successfully`,
        success: true as const,
      }
    },
    {
      body: t.Object({
        clientId: t.Number({ description: "Docker client ID", examples: [1, 2, 3] }),
        hostId: t.Number({ description: "Host ID to delete", examples: [1, 2, 3] }),
      }),
      detail: {
        description: "Removes a Docker host from the system.",
        summary: "Delete Docker Host",
      },
    }
  )
