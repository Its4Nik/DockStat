import Elysia from "elysia"
import { DNH } from "../../docker/docknode"
import { DockNodeModel } from "../../models/docknode"

export const DockNodeElyisa = new Elysia({
  prefix: "/node",
  detail: { tags: ["DockNode"] },
})
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
  .delete("/", ({ body }) => DNH.delteNode(body.id), {
    body: DockNodeModel.deleteBody,
  })
