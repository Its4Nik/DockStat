import { BunWebSocketHandler } from "@dockstat/utils/ws-handler/bun"
import { TokenVerifier } from "../lib/tokenVerifier"
import { BaseLogger } from "../logger"

export const DSWS = new BunWebSocketHandler(BaseLogger.spawn("WS-Handler"), {
  paths: ["/ws", "/api/v2/ws"],
  requireAuth: true,
  verifyToken: TokenVerifier,
})
