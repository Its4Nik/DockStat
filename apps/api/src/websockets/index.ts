import { formatBytes } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import { LogWebsoket } from "./logSocket"

const wsIntervals = new WeakMap<object, Timer>()

const RSS_INTERVAL_SEC = 2 * 1000

const DockStatWebsockets = new Elysia({ prefix: "/ws" }).use(LogWebsoket).ws("/rss", {
  response: t.String(),

  open(ws) {
    const sendRss = () => ws.send(formatBytes(process.memoryUsage().rss))
    sendRss()
    wsIntervals.set(ws, setInterval(sendRss, RSS_INTERVAL_SEC))
  },

  close(ws) {
    const interval = wsIntervals.get(ws)
    if (interval) {
      clearInterval(interval)
      wsIntervals.delete(ws)
    }
  },
})

export default DockStatWebsockets
