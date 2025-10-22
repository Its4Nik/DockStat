import Elysia from "elysia";
import { DockStatConfigTable } from "~/typings/db";

export const DatabaseElysiaInstance = new Elysia({ prefix: "/db" })
  .post("/dockstat-config", ({ body }) => {
    return { code: 200, message: "Updated DockStack config successfully.", newConfig: body }
  },
    {
      body: DockStatConfigTable
    })
  .get("/dockstat-config", () => "Hi")
