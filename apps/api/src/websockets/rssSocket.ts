import { memoryUsage } from "bun:jsc"
import { formatBytes } from "@dockstat/utils"
import Elysia, { t } from "elysia"

const wsIntervals = new WeakMap<object, Timer>()

const RSS_INTERVAL_SEC = 2 * 1000

export const RssSocket = new Elysia().ws("/rss", {
  response: t.String(),

  open(ws) {
    const sendRss = () => ws.send(formatBytes(memoryUsage().current))
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
