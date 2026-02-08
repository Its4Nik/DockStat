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
  .onBeforeHandle(({ request }) => {
    DockNodeLogger.info(`Received request: ${request.url}`)
  })

  .use(DockStacksRoutes)
  .get("/status", ({ status }) => {
    return status(200, "OK")
  })
  .listen(4040, () => {
    DockNodeLogger.info("Listening on http://localhost:4040")
  })

export { DockNode }
