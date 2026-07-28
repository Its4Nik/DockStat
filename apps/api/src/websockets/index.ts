import { verifyAuthToken } from "@dockstat/auth"
import Elysia from "elysia"
import BaseLogger from "../logger"
import WebSocketHandler from "./handler"
import { startRss } from "./logSocket"

const wsTokenVerifier = async (token: string) => {
  const payload = await verifyAuthToken(token)
  return (payload?.user as Record<string, unknown>) ?? null
}

export const DSWebSockerHandler = new WebSocketHandler(BaseLogger.spawn("WS-Handler"), {
  requireAuth: true,
  verifyToken: wsTokenVerifier,
})

BaseLogger.setLogHook((entry) => {
  DSWebSockerHandler.send("logs", entry)
})

startRss()

export const WsTopicsRoutes = new Elysia({
  name: "Ws-Topics",
  detail: {
    description: "Available WebSocket topics for data-pipe websocket-source nodes",
    tags: ["WebSockets"],
  },
  prefix: "/ws",
}).get(
  "/topics",
  () => ({
    data: DSWebSockerHandler.availableTopics(),
    success: true as const,
  }),
  {
    detail: {
      description:
        "Lists all WebSocket topics usable as data sources by websocket-source data-pipe nodes. Dashboard topics are excluded.",
      summary: "List Available WebSocket Topics",
    },
  }
)
