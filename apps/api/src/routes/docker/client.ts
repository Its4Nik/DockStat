import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"

export const DockerClientElysia = new Elysia({
  prefix: "/client",
  detail: {
    tags: ["Docker Client Management"],
  },
})
  .post(
    "/register",
    async ({ status, body }) => {
      const res = await DCM.registerClient(body.clientName, body.options || undefined)
      if (!res.success) {
        return status(400, {
          error: res.error,
          message: res.message,
          success: res.success,
        })
      }
      return status(200, {
        clientId: Number(res.clientId),
        message: res.message,
        success: res.success,
      })
    },
    {
      body: DockerModel.registerClientBody,
      response: {
        200: DockerModel.registerClientSuccess,
        400: DockerModel.registerClientError,
      },
    }
  )
  .delete("/delete", ({ body }) => DCM.removeClient(body.clientId), {
    body: t.Object({ clientId: t.Number() }),
  })
  .get("/all/:stored", ({ params }) => DCM.getAllClients(params.stored), {
    params: t.Object({ stored: t.Boolean({ default: false }) }),
  })
  .post("/monitoring/:clientId/start", ({ params }) => DCM.startMonitoring(params.clientId), {
    params: t.Object({
      clientId: t.Number(),
    }),
  })
  .post("/monitoring/:clientId/stop", ({ params }) => DCM.stopMonitoring(params.clientId), {
    params: t.Object({
      clientId: t.Number(),
    }),
  })

  .post(
    "/monitoring/:clientId/toggle",
    async ({ params }) => {
      const isMonitoring = await DCM.isMonitoring(params.clientId)
      if (isMonitoring) {
        return DCM.stopMonitoring(params.clientId)
      }
      return DCM.startMonitoring(params.clientId)
    },
    { params: t.Object({ clientId: t.Number() }) }
  )
  .post(
    "/create-monitoring-manager/:clientId",
    async ({ params }) => await DCM.createMonitoringManager(params.clientId),
    { params: t.Object({ clientId: t.Number() }) }
  )
