import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"
import { extractErrorMessage } from "@dockstat/utils"

export const DockerHostElysia = new Elysia({
  prefix: "/hosts",
  detail: {
    tags: ["Docker Host Management"],
  },
})
  .get("/", async ({ status }) => status(200, await DCM.getAllHosts()), {
    response: { 200: DockerModel.allHosts },
  })
  .get("/:clientId", async ({ params: { clientId } }) => await DCM.getAllHostMetrics(clientId), {
    params: t.Object({
      clientId: t.Number(),
    }),
  })
  .post(
    "/add",
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
      body: DockerModel.addHostBody,
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
  .post(
    "/update",
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
      body: DockerModel.updateBody,
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
