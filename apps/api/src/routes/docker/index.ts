import Elysia from "elysia"
import DCM from "../../docker"
import { DockerModel } from "../../models/docker"
import { DockerManager } from "./manager"
import { DockerClientElysia } from "./client"
import { DockerHostElysia } from "./hosts"
import { DockerContainerElysia } from "./container"

const DockerRoutes = new Elysia({
  prefix: "/docker",
  detail: {
    tags: ["Docker"],
  },
})
  .get(
    "/status",
    async ({ status }) => {
      try {
        const res = await DCM.getStatus()
        return status(200, res)
      } catch (error) {
        return status(400, {
          error: error,
          message: "Could not get Docker Status",
        })
      }
    },
    {
      response: {
        200: DockerModel.status,
        400: DockerModel.error,
      },
    }
  )
  .use(DockerManager)
  .use(DockerClientElysia)
  .use(DockerHostElysia)
  .use(DockerContainerElysia)

export default DockerRoutes
