import { DockStatError } from "@dockstat/errors"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

type ClientOperationResult =
  | { success: true; message: string; clientId: number }
  | { success: false; error: unknown; message: string }

export const DockerClientElysia = new Elysia({
  detail: {
    description:
      "Docker client management endpoints for registering, updating, and controlling Docker daemon connections.",
    tags: ["Docker Client Management"],
  },
  prefix: "/client",
})
  .post(
    "/",
    async ({ status, body }) => {
      const res = (await DCM.registerClient(
        body.clientName,
        body.options || undefined
      )) as ClientOperationResult
      if (!res.success) {
        throw new DockStatError("BAD_REQUEST", { message: res.message || "Registration failed" })
      }
      return status(200, {
        clientId: Number(res.clientId),
        message: res.message || "Client registered successfully",
        success: true as const,
      })
    },
    {
      body: DockerModel.registerClientBody,
      detail: {
        description: "Creates a new Docker client instance for managing Docker daemon connections.",
        responses: { 200: { description: "Successfully registered Docker client" } },
        summary: "Register Docker Client",
      },
      response: {
        200: DockerModel.registerClientSuccess,
        400: DockerModel.error,
      },
    }
  )
  .patch(
    "/",
    async ({ status, body }) => {
      const res = (await DCM.updateClient(
        body.clientId,
        body.clientName,
        body.options || {}
      )) as ClientOperationResult
      if (!res.success) {
        throw new DockStatError("BAD_REQUEST", { message: res.message || "Update failed" })
      }
      return status(200, {
        clientId: Number(res.clientId),
        message: res.message || "Client updated successfully",
        success: true as const,
      })
    },
    {
      body: DockerModel.updateClientBody,
      detail: {
        description: "Updates configuration for an existing Docker client.",
        responses: { 200: { description: "Successfully updated Docker client configuration" } },
        summary: "Update Docker Client",
      },
      response: {
        200: DockerModel.updateClientSuccess,
        400: DockerModel.error,
      },
    }
  )
  .delete(
    "/",
    async ({ body, status }) => {
      const result = await DCM.removeClient(body.clientId)
      return status(200, {
        data: result,
        message: `Client ${body.clientId} deleted successfully`,
        success: true as const,
      })
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
          "Removes a Docker client from the system, including all its associated hosts and resources.",
        responses: { 200: { description: "Successfully deleted Docker client" } },
        summary: "Delete Docker Client",
      },
    }
  )
  .get("/all/:stored", ({ params }) => DCM.getAllClients(params.stored), {
    detail: {
      description: "Retrieves all registered Docker clients.",
      responses: { 200: { description: "Successfully retrieved list of Docker clients" } },
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
    async ({ params }) => {
      await DCM.startMonitoring(params.clientId)
      return { message: "Monitoring started", success: true as const }
    },
    {
      detail: {
        description: "Starts real-time monitoring for a Docker client.",
        responses: { 200: { description: "Successfully started monitoring" } },
        summary: "Start Client Monitoring",
      },
      params: t.Object({
        clientId: t.Number({ description: "Docker client ID", examples: [1, 2, 3] }),
      }),
    }
  )
  .post(
    "/monitoring/:clientId/stop",
    async ({ params }) => {
      await DCM.stopMonitoring(params.clientId)
      return { message: "Monitoring stopped", success: true as const }
    },
    {
      detail: {
        description: "Stops real-time monitoring for a Docker client.",
        responses: { 200: { description: "Successfully stopped monitoring" } },
        summary: "Stop Client Monitoring",
      },
      params: t.Object({
        clientId: t.Number({ description: "Docker client ID", examples: [1, 2, 3] }),
      }),
    }
  )
  .post(
    "/monitoring/:clientId/toggle",
    async ({ params }) => {
      const isMonitoring = await DCM.isMonitoring(params.clientId)
      if (isMonitoring) {
        await DCM.stopMonitoring(params.clientId)
        return { isMonitoring: false, message: "Monitoring stopped", success: true as const }
      }
      await DCM.startMonitoring(params.clientId)
      return { isMonitoring: true, message: "Monitoring started", success: true as const }
    },
    {
      detail: {
        description: "Toggles monitoring state for a Docker client.",
        responses: { 200: { description: "Successfully toggled monitoring" } },
        summary: "Toggle Client Monitoring",
      },
      params: t.Object({
        clientId: t.Number({ description: "Docker client ID", examples: [1, 2, 3] }),
      }),
    }
  )
  .post(
    "/create-monitoring-manager/:clientId",
    async ({ params }) => {
      await DCM.createMonitoringManager(params.clientId)
      return { message: "Monitoring manager created", success: true as const }
    },
    {
      detail: {
        description: "Creates a monitoring manager instance for a Docker client.",
        responses: { 200: { description: "Successfully created monitoring manager" } },
        summary: "Create Monitoring Manager",
      },
      params: t.Object({
        clientId: t.Number({ description: "Docker client ID", examples: [1, 2, 3] }),
      }),
    }
  )
