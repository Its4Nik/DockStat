import { verifyAuthToken } from "@dockstat/auth"
import { WidgetsService as WidgetsServiceFactory } from "widgets/server"
import { DockStatDB } from "./database"
import BaseLogger from "./logger"
import { DSWebSockerHandler } from "./websockets"

const wsTokenVerifier = async (token: string) => {
  const payload = await verifyAuthToken(token)
  return (payload?.user as Record<string, unknown>) ?? null
}

export const WidgetsService = new WidgetsServiceFactory(DockStatDB._sqliteWrapper, BaseLogger, {
  requireAuth: true,
  verifyToken: wsTokenVerifier,
})

/**
 * Register data sources via the main WebSocket pub/sub handler.
 *
 * When a data-pipe node of type "websocket-source" references a topic
 * (e.g. "logs", "metrics/containers"), the provider subscribes to that
 * topic on the DSWebSockerHandler and receives live data which then
 * flows through the pipe to widgets.
 *
 * Note: The DSWebSockerHandler publishes server→client. For server-internal
 * pub/sub we hook into the send() call so any data published to a topic
 * is also forwarded to registered data-pipe sources.
 */
WidgetsService.connectDataSourceHandler({
  publish: (topic, data) => {
    return DSWebSockerHandler.send(topic as never, data)
  },
  subscribe: (topic, callback) => {
    // Hook into the main WS handler so that whenever data is published
    // to a topic, our data-pipe sources receive it too.
    return DSWebSockerHandler.onInternalPublish(topic, callback)
  },
})
