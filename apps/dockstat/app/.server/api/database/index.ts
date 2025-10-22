import Elysia, { t } from "elysia";
import { DockStatConfigTable, UpdateDockStatConfigTableResponse } from "@dockstat/typings/schemas";
import { DockStatDB } from "~/.server/db";

export const DatabaseElysiaInstance = new Elysia({ prefix: "/db" })
  .post("/dockstat-config", ({ body }) => {
    const updateRes = DockStatDB.configTable.where({ id: 0 }).update(body)
    const newConfig = DockStatDB.configTable.select(["*"]).where({ id: 0 }).get()
    return {
      message: "Updated config successfully",
      code: 200,
      update_response: updateRes,
      new_config: newConfig
    }
  },
    {
      body: DockStatConfigTable,
      response: UpdateDockStatConfigTableResponse
    })
  .get("/dockstat-config", () => "Hi")
