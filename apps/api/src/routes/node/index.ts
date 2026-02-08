import Elysia from "elysia"
import { DockStatDB } from "../../database"
import DockNodeHandler from "../../docknode"
import BaseLogger from "../../logger"
import { DockNodeModel } from "../../models/docknode"

const DNH = new DockNodeHandler(DockStatDB._sqliteWrapper, BaseLogger)

export const DockNodeElyisa = new Elysia({ prefix: "/node", detail: { tags: ["DockNode"] } })
  .get("/", async ({ status }) => {
    return status(200, await DNH.getAllNodes())
  })
  .post(
    "/",
    ({ body }) => {
      DNH.createNode(body)
    },
    { body: DockNodeModel.createBody }
  )
  .delete("/", ({ body }) => DNH.delteNode(body.id), { body: DockNodeModel.deleteBody })
