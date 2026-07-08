import { Logger } from "@dockstat/logger"

// Lazy load WebSocket handler to avoid circular dependency
let wsHandler: typeof import("./websockets").DSWebSockerHandler | null = null

const BaseLogger = new Logger("DockStatAPI", [], (entry) => {
  // Lazy load and send logs to WebSocket
  if (!wsHandler) {
    try {
      wsHandler = require("./websockets").DSWebSockerHandler
    } catch (error) {
      // WebSocket handler not available yet, will retry on next log
      return
    }
  }
  wsHandler?.send("logs", entry)
})

export default BaseLogger
