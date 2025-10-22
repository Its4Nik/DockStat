import Elysia from "elysia";
import { DatabaseElysiaInstance } from "./database";
import {
  openapi
} from '@elysiajs/openapi'

export const DockStatAPI = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
    })
  )
  .get("/status", () => ({
    message: "Looking goood",
    status: 200
  }))
  .use(DatabaseElysiaInstance)

if (import.meta.main) {
  DockStatAPI.listen(3000, console.log)
  console.log("DockStatAPI is running in dev mode, see the docs: https://localhost:3000/api/docs")
}

export {
  DatabaseElysiaInstance
}

export type DockStatAPIType = typeof DockStatAPI
