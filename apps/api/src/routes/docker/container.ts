import Elysia, { t } from "elysia"
import DCM from "../../docker"

export const DockerContainerElysia = new Elysia({
  prefix: "/containers",
  detail: {
    tags: ["Docker Containers"],
  },
})
  .get("/all-containers", async ({ status }) => {
    const CC = await DCM.getAllContainerStats()
    return status(200, CC)
  })
  .get("/all/:clientId", async ({ params: { clientId } }) => await DCM.getAllContainers(clientId), {
    params: t.Object({
      clientId: t.Number(),
    }),
  })
