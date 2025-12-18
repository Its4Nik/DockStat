import Elysia from "elysia"
import DCM from "../../docker"
import { extractErrorMessage } from "@dockstat/utils"
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
  .use(DockerManager)
  .use(DockerClientElysia)
  .use(DockerHostElysia)
  .use(DockerContainerElysia)

export default DockerRoutes
