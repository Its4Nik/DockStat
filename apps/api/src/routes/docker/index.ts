import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DockerClientElysia } from "./client"
import { DockerContainerElysia } from "./container"
import { DockerHostElysia } from "./hosts"
import { DockerManager } from "./manager"

const DockerRoutes = new Elysia({
  prefix: "/docker",
  detail: {
    tags: ["Docker"],
  },
})
  .get("/status", async ({ status }) => {
    try {
      const res = await DCM.getStatus()
      return status(200, res)
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Could not get Docker Status")
      return status(400, {
        success: false as const,
        error: errorMessage,
        message: errorMessage,
      })
    }
  })
  .get("/ping", async ({ status }) => {
    try {
      const clients = DCM.getAllClients()
      const hosts = await DCM.getAllHosts()
      const hostsMap = new Map(hosts.map((h) => [h.id, h]))

      const pingRes = await Promise.all(
        clients.map(async (c) => {
          const ping = await DCM.ping(c.id)
          return {
            clientId: c.id,
            clientName: c.name,
            reachable: ping.reachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
            unreachable: ping.unreachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
          }
        })
      )

      return status(200, pingRes)
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Could not ping Docker")
      return status(400, {
        success: false as const,
        error: errorMessage,
        message: errorMessage,
      })
    }
  })
  .get(
    "/ping/:clientId",
    async ({ status, params }) => {
      try {
        const clients = DCM.getAllClients()
        const targetClients = params.clientId
          ? clients.filter((c) => c.id === params.clientId)
          : clients

        const hosts = await DCM.getAllHosts()
        const hostsMap = new Map(hosts.map((h) => [h.id, h]))

        const pingRes = await Promise.all(
          targetClients.map(async (c) => {
            const ping = await DCM.ping(c.id)
            return {
              clientId: c.id,
              clientName: c.name,
              reachable: ping.reachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
              unreachable: ping.unreachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
            }
          })
        )

        return status(200, params.clientId ? pingRes[0] : pingRes)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Could not ping Docker")
        return status(400, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      params: t.Partial(
        t.Object({
          clientId: t.Number(),
        })
      ),
    }
  )
  .use(DockerManager)
  .use(DockerClientElysia)
  .use(DockerHostElysia)
  .use(DockerContainerElysia)

export default DockerRoutes
