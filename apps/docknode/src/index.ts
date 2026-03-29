import openapi from "@elysiajs/openapi"
import { Elysia, t } from "elysia"
import { DockStacksRoutes, SwarmRoutes } from "./stacks/routes"
import SwarmHandler from "./stacks/swarm"
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
  .use(SwarmRoutes)
  .get("/status", ({ status }) => {
    return status(200, "OK")
  })

  // ============================================
  // WebSocket for Streaming Logs
  // ============================================
  .ws("/logs/stream", {
    body: t.Object({
      serviceId: t.String(),
      follow: t.Optional(t.Boolean()),
      tail: t.Optional(t.Number()),
      since: t.Optional(t.Number()),
      timestamps: t.Optional(t.Boolean()),
    }),
    response: t.Object({
      timestamp: t.String(),
      message: t.String(),
      serviceId: t.Optional(t.String()),
      serviceName: t.Optional(t.String()),
      nodeId: t.Optional(t.String()),
      nodeName: t.Optional(t.String()),
      level: t.UnionEnum(["info", "warn", "error", "debug"]),
    }),
    open(_ws) {
      DockNodeLogger.info(`WebSocket client connected for logs`)
    },
    close(_ws) {
      DockNodeLogger.info(`WebSocket client disconnected from logs`)
    },
    async message(ws, body) {
      try {
        await SwarmHandler.getServiceLogs(
          {
            serviceId: body.serviceId,
            follow: body.follow ?? false,
            tail: body.tail ?? 100,
            since: body.since,
            timestamps: body.timestamps ?? true,
          },
          (log) => {
            ws.send(log)
          }
        )
      } catch (error) {
        ws.send({
          timestamp: new Date().toISOString(),
          message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`,
          serviceId: body.serviceId,
          level: "error",
        })
      }
    },
  })

  .listen(4040, () => {
    DockNodeLogger.info("Listening on http://localhost:4040")
  })

export { DockNode }
