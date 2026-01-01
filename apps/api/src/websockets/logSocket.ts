import Elysia, { type Context, t } from "elysia"
import type { Prettify } from "elysia/types"
import type { ElysiaWS } from "elysia/ws"

export const logClients = new Set<Prettify<ElysiaWS<Context>>>()

export const LogWebsoket = new Elysia().ws("/logs", {
  response: t.Object({
    level: t.UnionEnum(["error", "warn", "info", "debug"]),
    message: t.String(),
    name: t.String(),
    parents: t.Array(t.String()),
    requestId: t.Optional(t.String()),
    timestamp: t.Date(),
    caller: t.String(),
  }),

  open(ws) {
    logClients.add(ws)
  },

  close(ws) {
    logClients.delete(ws)
  },
})
