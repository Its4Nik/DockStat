import { extractErrorMessage } from "@dockstat/utils"
import Elysia from "elysia"
import { DockStatDB } from "../database"
import { updateConfig } from "../database/utils"
import { DatabaseModel } from "../models/database"

const DBRoutes = new Elysia({
  name: "DatabaseElysiaInstance",
  prefix: "/db",
  detail: {
    tags: ["DB"],
  },
})
  .post(
    "config",
    ({ body, status }) => {
      try {
        const res = updateConfig(body)
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Database")
        return status(400, {
          success: false as const,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      body: DatabaseModel.updateBody,
      response: {
        200: DatabaseModel.updateRes,
        400: DatabaseModel.updateError,
      },
    }
  )
  .get("config", ({ status }) => {
    try {
      const res = DockStatDB.configTable.select(["*"]).all()[0]
      return status(200, res)
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Error while opening Database")
      return status(400, {
        success: false as const,
        error: errorMessage,
        message: errorMessage,
      })
    }
  })

export default DBRoutes
