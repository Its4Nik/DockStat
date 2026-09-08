import { BunWebSocketHandler } from "@dockstat/utils/ws-handler/bun"
import { TokenVerifier } from "../lib/tokenVerifier"
import { BaseLogger } from "../logger"

const DSWSServicesLogger = BaseLogger.spawn("WS-Handler")

export const DSWS = new BunWebSocketHandler(DSWSServicesLogger, {
  paths: ["/ws", "/api/v2/ws"],
  requireAuth: true,
  verifyToken: TokenVerifier,
})

DSWSServicesLogger.info(
  `Shared WebSocket handler ready: paths=[${["/ws", "/api/v2/ws"].join(",")}], requireAuth=true`
)
