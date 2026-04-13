import Elysia, { t } from "elysia"
import DCM from "../../docker"

export const DockerContainerElysia = new Elysia({
  detail: {
    tags: ["Docker Containers"],
  },
  prefix: "/containers",
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
