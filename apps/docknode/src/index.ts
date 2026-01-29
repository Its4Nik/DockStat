import openapi from "@elysiajs/openapi"
import { Elysia } from "elysia"
import { DockStacksRoutes } from "./stacks/routes"
import { DockNodeLogger } from "./utils/logger"

const DockNode = new Elysia({ prefix: "/api" })
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
    })
  )
  .use(DockStacksRoutes)
  .listen(4040, () => {
    DockNodeLogger.info("Listening on http://localhost:4040")
  })

export { DockNode }
