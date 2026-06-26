import Elysia, { t } from "elysia"
import { dockerCache } from "../../cache"
import DCM from "../../docker"

export const DockerContainerElysia = new Elysia({
  detail: {
    tags: ["Docker Containers"],
  },
  prefix: "/containers",
})
  .get("/all-containers", async ({ status }) => {
    // Cache container stats for 10 seconds
    const cached = dockerCache.getOrComputeAsync("all-containers", () => DCM.getAllContainerStats())
    return status(200, await cached)
  })
  .get(
    "/all/:clientId",
    async ({ params: { clientId } }) => {
      // Per-client caching
      return dockerCache.getOrComputeAsync(`client-${clientId}-containers`, () =>
        DCM.getAllContainers(clientId)
      )
    },
    {
      params: t.Object({
        clientId: t.Number(),
      }),
    }
  )
