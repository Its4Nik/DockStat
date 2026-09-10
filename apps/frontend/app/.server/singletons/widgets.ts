import { WidgetsService } from "@dockstat/widgets/server"
import { TokenVerifier } from "../lib/tokenVerifier"
import { BaseLogger } from "../logger"
import { DockStatDB } from "./db"
import { DSWS } from "./wsHandler"

const WidgetsServicesLogger = BaseLogger.spawn("Widgets")

export const Widgets = new WidgetsService(DockStatDB._sqliteWrapper, BaseLogger, {
  requireAuth: true,
  verifyToken: TokenVerifier,
})

WidgetsServicesLogger.info("Widgets service wired to shared WebSocket handler")

/**
 * Route widget data updates through the SHARED WebSocket connection.
 * The frontend connects to /api/v3/ws only and subscribes to
 * `widgets/dashboard/<id>` topics, so all payloads must be published there.
 */
Widgets.ws.sendDataUpdate = (dashboardId, payloads) =>
  DSWS.send(`widgets/dashboard/${dashboardId}`, {
    dashboardId,
    payloads,
    type: "data-update",
  })

WidgetsServicesLogger.debug(
  `Widgets WS sendDataUpdate overridden to route through DSWS topic widgets/dashboard/<dashboardId>`
)

/**
 * Register data sources via the main WebSocket pub/sub handler so
 * "websocket-source" data-pipe nodes receive live topic data.
 */
Widgets.connectDataSourceHandler({
  publish: (topic, data) => DSWS.send(topic, data),
  subscribe: (topic, callback) => DSWS.onInternalPublish(topic, callback),
})

WidgetsServicesLogger.info("Widget data-source handler connected to shared WS pub/sub")

/**
 * When a client subscribes to a dashboard topic, immediately evaluate that
 * dashboard's data-pipe so static providers reach the client right away.
 */
const WIDGET_DASHBOARD_TOPIC_PREFIX = "widgets/dashboard/"
DSWS.onFirstSubscriber(async (topic) => {
  if (!topic.startsWith(WIDGET_DASHBOARD_TOPIC_PREFIX)) return
  const dashboardId = topic.slice(WIDGET_DASHBOARD_TOPIC_PREFIX.length)
  const dashboard = Widgets.dashboards.getById(dashboardId)
  if (!dashboard) {
    WidgetsServicesLogger.warn(
      `Initial data-pipe evaluation skipped: dashboard not found for topic "${topic}", dashboardId=${dashboardId}`
    )
    return
  }

  WidgetsServicesLogger.debug(
    `Initial data-pipe evaluation triggered for topic "${topic}", dashboardId=${dashboardId}`
  )

  try {
    const payloads = await Widgets.engine.evaluate(dashboardId, dashboard.dataPipe)
    if (payloads.length > 0) Widgets.ws.sendDataUpdate(dashboardId, payloads)
  } catch (err) {
    WidgetsServicesLogger.warn(
      `Initial data-pipe evaluation for subscriber on "${topic}" failed: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  }
})
