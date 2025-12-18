import { extractErrorMessage } from "@dockstat/utils"
import Elysia from "elysia"
import { DockStatDB } from "../../database"
import { formatPrometheusMetrics } from "../../middleware/metrics"
import { MetricsModel } from "../../models/metrics"

const PrometheusMetricsRoute = new Elysia({ prefix: "/metrics" }).get(
  "/",
  ({ status }) => {
    try {
      const res = formatPrometheusMetrics(DockStatDB._sqliteWrapper.getDb())
      return status(200, res)
    } catch (error) {
      const errorMessage = extractErrorMessage(error, "Could not get Prometheus metrics!")
      return status(400, {
        success: false as const,
        error: errorMessage,
        message: errorMessage,
      })
    }
  },
  {
    response: {
      200: MetricsModel.prometheusRes,
      400: MetricsModel.prometheusError,
    },
  }
)

export default PrometheusMetricsRoute
