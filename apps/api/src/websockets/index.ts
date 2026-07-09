import WebSocketHandler from "./handler"
import BaseLogger from "../logger"
import { startRss } from "./logSocket"
import { verifyAuthToken } from "@dockstat/auth"

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
