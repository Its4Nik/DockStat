import Elysia from "elysia"
import { DockStatDB } from "../database"
import { updateConfig } from "../database/utils"
import { DatabaseModel } from "../models/database"

//const logger = BaseLogger.spawn("Test")

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
        return status(400, {
          message: "Error while updating Database",
          error: error,
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
    } catch (_error) {
      return status(400, "Error while opening Database")
    }
  })

export default DBRoutes
