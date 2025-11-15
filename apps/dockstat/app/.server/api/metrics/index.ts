import Elysia from 'elysia'
import { formatPrometheusMetrics, metricsMiddleware } from './helper'
import { DockStatDB } from '~/.server/db'
import { ElysiaLogger } from '../logger'

const db = DockStatDB._sqliteWrapper.getDb()

const DockStatMetricsElysiaInstance = new Elysia({
  name: "DockStatMetricsElysiaInstance",
	detail: { tags: ['Metrics'] },
})
	.use(metricsMiddleware)
	.get('/metrics', () => {
		const metrics = formatPrometheusMetrics(db)
		return new Response(metrics, {
		status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    }
		})
	})

export default DockStatMetricsElysiaInstance
