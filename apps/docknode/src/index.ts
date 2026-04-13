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
      follow: t.Optional(t.Boolean()),
      serviceId: t.String(),
      since: t.Optional(t.Number()),
      tail: t.Optional(t.Number()),
      timestamps: t.Optional(t.Boolean()),
    }),
    close(_ws) {
      DockNodeLogger.info(`WebSocket client disconnected from logs`)
    },
    async message(ws, body) {
      try {
        await SwarmHandler.getServiceLogs(
          {
            follow: body.follow ?? false,
            serviceId: body.serviceId,
            since: body.since,
            tail: body.tail ?? 100,
            timestamps: body.timestamps ?? true,
          },
          (log) => {
            ws.send(log)
          }
        )
      } catch (error) {
        ws.send({
          level: "error",
          message: `Error fetching logs: ${error instanceof Error ? error.message : String(error)}`,
          serviceId: body.serviceId,
          timestamp: new Date().toISOString(),
        })
      }
    },
    open(_ws) {
      DockNodeLogger.info(`WebSocket client connected for logs`)
    },
    response: t.Object({
      level: t.UnionEnum(["info", "warn", "error", "debug"]),
      message: t.String(),
      nodeId: t.Optional(t.String()),
      nodeName: t.Optional(t.String()),
      serviceId: t.Optional(t.String()),
      serviceName: t.Optional(t.String()),
      timestamp: t.String(),
    }),
  })

  .listen(4040, () => {
    DockNodeLogger.info("Listening on http://localhost:4040")
  })

export { DockNode }
