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
 * Route widget data updates through the SHARED WebSocket connection
 * (DSWebSockerHandler mounted at /api/v2/ws).
 *
 * The frontend's WebSocketProvider connects to /api/v2/ws only — it does
 * NOT connect to the widgets-only endpoint (/api/v2/ws/widgets). So for
 * any widget payload to actually reach a subscribed client it MUST be
 * published on the shared handler under the topic the client subscribes
 * to, which is `widgets/dashboard/<id>`.
 *
 * We override `ws.sendDataUpdate` so both call-sites
 * (data-pipe-routes.ts on manual evaluate, startPollingAll on periodic
 * ticks) transparently publish through the shared handler.
 */
WidgetsService.ws.sendDataUpdate = (dashboardId, payloads) => {
  return DSWebSockerHandler.send(
    `widgets/dashboard/${dashboardId}` as never,
    // Keep the existing envelope shape so useWidgetData's transform keeps
    // working (it expects { dashboardId, payloads, type }).
    { dashboardId, payloads, type: "data-update" }
  )
}

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

/**
 * When a client subscribes to a dashboard's widget topic, immediately
 * evaluate that dashboard's data-pipe so static providers (and any
 * currently-cached websocket-source data) reach the client without it
 * having to wait for a manual evaluate or the periodic poll loop.
 *
 * This is what makes static data pipelines "just work" when a widget
 * dashboard is opened.
 */
const WIDGET_DASHBOARD_TOPIC_PREFIX = "widgets/dashboard/"
DSWebSockerHandler.onFirstSubscriber(async (topic) => {
  if (!topic.startsWith(WIDGET_DASHBOARD_TOPIC_PREFIX)) return
  const dashboardId = topic.slice(WIDGET_DASHBOARD_TOPIC_PREFIX.length)
  const dashboard = WidgetsService.dashboards.getById(dashboardId)
  if (!dashboard) return

  try {
    const payloads = await WidgetsService.engine.evaluate(dashboardId, dashboard.dataPipe)
    if (payloads.length > 0) {
      WidgetsService.ws.sendDataUpdate(dashboardId, payloads)
    }
  } catch (err) {
    BaseLogger.warn(
      `Initial data-pipe evaluation for subscriber on "${topic}" failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
})
