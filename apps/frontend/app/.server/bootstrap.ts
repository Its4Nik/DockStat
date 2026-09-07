import { memoryUsage } from "bun:jsc"
import { formatBytes } from "@dockstat/utils"
import { BaseLogger } from "./logger"
import { DSWS } from "./singletons/wsHandler"
import "./singletons/widgets" // wires widget data-pipe updates into DSWS

// Broadcast log entries and RSS usage through the shared WebSocket handler.
BaseLogger.setLogHook((entry) => DSWS.send("logs", entry))

const RSS_INTERVAL = 5_000
setInterval(() => {
  DSWS.send("rss", formatBytes(memoryUsage().current))
}, RSS_INTERVAL)
