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
  },
})
  .post(
    "/register",
    async ({ status, body }) => {
      try {
        const res = (await DCM.registerClient(
          body.clientName,
          body.options || undefined
        )) as ClientOperationResult
        if (!res.success) {
          // res.error is the raw error object, extract a string message from it
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
      body: DockerModel.registerClientBody,
      response: {
        200: DockerModel.registerClientSuccess,
        400: DockerModel.error,
        500: DockerModel.error,
      },
    }
  )
  .post(
    "/update",
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
      body: DockerModel.updateClientBody,
      response: {
        200: DockerModel.updateClientSuccess,
        400: DockerModel.error,
        500: DockerModel.error,
      },
    }
  )
  .delete(
    "/delete",
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
      body: t.Object({ clientId: t.Number() }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String(),
          data: t.Any(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
  .get("/all/:stored", ({ params }) => DCM.getAllClients(params.stored), {
    params: t.Object({ stored: t.Boolean({ default: false }) }),
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
      params: t.Object({ clientId: t.Number() }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
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
      params: t.Object({ clientId: t.Number() }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
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
      params: t.Object({ clientId: t.Number() }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String(),
          isMonitoring: t.Boolean(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
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
      params: t.Object({ clientId: t.Number() }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          message: t.String(),
        }),
        500: t.Object({
          success: t.Literal(false),
          error: t.String(),
        }),
      },
    }
  )
