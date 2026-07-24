import { verifyAuthToken } from "@dockstat/auth"
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
