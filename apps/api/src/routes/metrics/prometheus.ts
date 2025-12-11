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
      return status(400, {
        error: error,
        message: "Could not get Prometheus metrics!",
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
