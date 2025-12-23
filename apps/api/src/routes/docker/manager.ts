import { extractErrorMessage } from "@dockstat/utils"
import Elysia from "elysia"
import DCM from "../../docker"

export const DockerManager = new Elysia({
  prefix: "/manager",
  detail: {
    tags: ["Docker Manager"],
  },
})
  .get("/pool-stats", async ({ status }) => {
    try {
      const res = await DCM.getPoolMetrics()
      return status(200, res)
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Could not get Pool Stats")
      return status(400, {
        success: false as const,
        error: errorMessage,
        message: errorMessage,
      })
    }
  })
  .post("/init-all-clients", ({ status }) => {
    try {
      const allClients = DCM.getAllClients()
      for (const c of allClients) {
        DCM.init(c.id)
      }
      return status(200, DCM.getAllClients(true))
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Could not initialize clients")
      return status(400, {
        success: false as const,
        error: errorMessage,
        message: errorMessage,
      })
    }
  })
