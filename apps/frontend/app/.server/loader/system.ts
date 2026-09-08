import { formatPrometheusMetrics } from "../metrics/recorder"
import Singletons from "../singletons"

export const SystemLoaders = {
  /** GET — Prometheus exposition of the request metrics */
  prometheus: () => {
    const db = Singletons.DB._sqliteWrapper.getDb()
    return new Response(formatPrometheusMetrics(db), {
      headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
    })
  },
}
