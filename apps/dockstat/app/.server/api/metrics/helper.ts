import type { Elysia } from 'elysia'
import { Database } from 'bun:sqlite'
import Logger from '@dockstat/logger'
import { ElysiaLogger } from '../logger'

const logger = new Logger("Metrics", ElysiaLogger.getParentsForLoggerChaining())

interface RequestMetrics {
	totalRequests: number
	requestsByMethod: Map<string, number>
	requestsByPath: Map<string, number>
	requestsByStatus: Map<number, number>
	requestDurations: number[]
	errors: number
}

const metrics: RequestMetrics = {
	totalRequests: 0,
	requestsByMethod: new Map(),
	requestsByPath: new Map(),
	requestsByStatus: new Map(),
	requestDurations: [],
	errors: 0,
}

export const metricsMiddleware = (app: Elysia) => {
	return app
	  .state("startTime",0)
		.onBeforeHandle({ as: 'global' }, ({ store, request }) => {
			store.startTime = performance.now()
			logger.debug(`Started performance tracking`, request.headers.get("x-dockstatapi-requestid") ?? undefined )
		})
		.onAfterHandle(
			{ as: 'global' },
			({ request, response, store }: any) => {
				const duration = performance.now() - (store.startTime || 0)
				const method = request.method
				const path = new URL(request.url).pathname

				logger.debug(`[${method}] Took ${Math.round(duration)}ms on ${path}`, request.headers.get("x-dockstatapi-requestid") ?? undefined)

        if (path === '/api/metrics') {
          logger.debug(`Skipped path: ${path}`, request.headers.get("x-dockstatapi-requestid"))
        } else {

          metrics.totalRequests++

          // Track by method
          metrics.requestsByMethod.set(
            method,
            (metrics.requestsByMethod.get(method) || 0) + 1
          )

          // Track by path
          metrics.requestsByPath.set(
            path,
            (metrics.requestsByPath.get(path) || 0) + 1
          )

          // Track by status
          const status = response?.status || 200
          metrics.requestsByStatus.set(
            status,
            (metrics.requestsByStatus.get(status) || 0) + 1
          )

          // Track duration (keep last 1000 requests)
          metrics.requestDurations.push(duration)
          if (metrics.requestDurations.length > 1000) {
            metrics.requestDurations.shift()
          }
        }

				logger.debug("Tracked metrics", request.headers.get("x-dockstatapi-requestid") ?? undefined)
			}
		)
		.onError({ as: 'global' }, ({ store , request}: any) => {
			metrics.errors++
			logger.debug("Tracked Error", request.headers.get("x-dockstatapi-requestid") ?? undefined)
			const duration = performance.now() - (store.startTime || 0)
			metrics.requestDurations.push(duration)
		})
}

// Database metrics collector
function getDatabaseMetrics(db: Database) {
	const dbMetrics = {
		size: 0,
		pageCount: 0,
		pageSize: 0,
		tableCount: 0,
		tables: [] as Array<{ name: string; rowCount: number }>,
	}

	try {
		// Get database file size
		const sizeQuery = db.query(
			'SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()'
		)
		const sizeResult = sizeQuery.get() as any
		dbMetrics.size = sizeResult?.size || 0

		// Get page info
		const pageCountQuery = db.query('PRAGMA page_count')
		const pageCountResult = pageCountQuery.get() as any
		dbMetrics.pageCount = pageCountResult?.page_count || 0

		const pageSizeQuery = db.query('PRAGMA page_size')
		const pageSizeResult = pageSizeQuery.get() as any
		dbMetrics.pageSize = pageSizeResult?.page_size || 0

		// Get all tables
		const tablesQuery = db.query(
			"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
		)
		const tables = tablesQuery.all() as Array<{ name: string }>
		dbMetrics.tableCount = tables.length

		// Get row counts for each table
		for (const table of tables) {
			try {
				const countQuery = db.query(
					`SELECT COUNT(*) as count FROM "${table.name}"`
				)
				const countResult = countQuery.get() as any
				dbMetrics.tables.push({
					name: table.name,
					rowCount: countResult?.count || 0,
				})
			} catch (_) {
				// Skip tables we can't read
			}
		}
	} catch (error) {
		console.error('Error collecting database metrics:', error)
	}

	return dbMetrics
}

// Format metrics in Prometheus format
export function formatPrometheusMetrics(db: Database) {
	const lines: string[] = []
	const timestamp = Date.now()

	// HTTP Metrics
	lines.push(
		'# HELP http_requests_total Total number of HTTP requests'
	)
	lines.push('# TYPE http_requests_total counter')
	lines.push(
		`http_requests_total ${metrics.totalRequests} ${timestamp}`
	)

	lines.push(
		'\n# HELP http_requests_by_method_total HTTP requests by method'
	)
	lines.push('# TYPE http_requests_by_method_total counter')
	for (const [method, count] of metrics.requestsByMethod.entries()) {
		lines.push(
			`http_requests_by_method_total{method="${method}"} ${count} ${timestamp}`
		)
	}

	lines.push(
		'\n# HELP http_requests_by_path_total HTTP requests by path'
	)
	lines.push('# TYPE http_requests_by_path_total counter')
	for (const [path, count] of metrics.requestsByPath.entries()) {
		lines.push(
			`http_requests_by_path_total{path="${path}"} ${count} ${timestamp}`
		)
	}

	lines.push(
		'\n# HELP http_requests_by_status_total HTTP requests by status code'
	)
	lines.push('# TYPE http_requests_by_status_total counter')
	for (const [status, count] of metrics.requestsByStatus.entries()) {
		lines.push(
			`http_requests_by_status_total{status="${status}"} ${count} ${timestamp}`
		)
	}

	lines.push(
		'\n# HELP http_request_errors_total Total number of HTTP errors'
	)
	lines.push('# TYPE http_request_errors_total counter')
	lines.push(
		`http_request_errors_total ${metrics.errors} ${timestamp}`
	)

	// Request duration metrics
	if (metrics.requestDurations.length > 0) {
		const sorted = [...metrics.requestDurations].sort((a, b) => a - b)
		const sum = sorted.reduce((a, b) => a + b, 0)
		const avg = sum / sorted.length
		const p50 = sorted[Math.floor(sorted.length * 0.5)]
		const p95 = sorted[Math.floor(sorted.length * 0.95)]
		const p99 = sorted[Math.floor(sorted.length * 0.99)]

		lines.push(
			'\n# HELP http_request_duration_ms HTTP request duration in milliseconds'
		)
		lines.push('# TYPE http_request_duration_ms summary')
		lines.push(
			`http_request_duration_ms{quantile="0.5"} ${p50.toFixed(2)} ${timestamp}`
		)
		lines.push(
			`http_request_duration_ms{quantile="0.95"} ${p95.toFixed(2)} ${timestamp}`
		)
		lines.push(
			`http_request_duration_ms{quantile="0.99"} ${p99.toFixed(2)} ${timestamp}`
		)
		lines.push(
			`http_request_duration_ms_sum ${sum.toFixed(2)} ${timestamp}`
		)
		lines.push(
			`http_request_duration_ms_count ${sorted.length} ${timestamp}`
		)

		lines.push(
			'\n# HELP http_request_duration_avg_ms Average HTTP request duration in milliseconds'
		)
		lines.push('# TYPE http_request_duration_avg_ms gauge')
		lines.push(
			`http_request_duration_avg_ms ${avg.toFixed(2)} ${timestamp}`
		)
	}

	// Database metrics
	const dbMetrics = getDatabaseMetrics(db)

	lines.push(
		'\n# HELP database_size_bytes Database file size in bytes'
	)
	lines.push('# TYPE database_size_bytes gauge')
	lines.push(`database_size_bytes ${dbMetrics.size} ${timestamp}`)

	lines.push(
		'\n# HELP database_page_count Total number of database pages'
	)
	lines.push('# TYPE database_page_count gauge')
	lines.push(`database_page_count ${dbMetrics.pageCount} ${timestamp}`)

	lines.push(
		'\n# HELP database_page_size_bytes Database page size in bytes'
	)
	lines.push('# TYPE database_page_size_bytes gauge')
	lines.push(
		`database_page_size_bytes ${dbMetrics.pageSize} ${timestamp}`
	)

	lines.push('\n# HELP database_table_count Total number of tables')
	lines.push('# TYPE database_table_count gauge')
	lines.push(
		`database_table_count ${dbMetrics.tableCount} ${timestamp}`
	)

	lines.push('\n# HELP database_table_rows Number of rows per table')
	lines.push('# TYPE database_table_rows gauge')
	for (const table of dbMetrics.tables) {
		lines.push(
			`database_table_rows{table="${table.name}"} ${table.rowCount} ${timestamp}`
		)
	}

	// Process metrics
	const memUsage = process.memoryUsage()
	lines.push(
		'\n# HELP process_memory_rss_bytes Process resident memory in bytes'
	)
	lines.push('# TYPE process_memory_rss_bytes gauge')
	lines.push(`process_memory_rss_bytes ${memUsage.rss} ${timestamp}`)

	lines.push(
		'\n# HELP process_memory_heap_used_bytes Process heap memory used in bytes'
	)
	lines.push('# TYPE process_memory_heap_used_bytes gauge')
	lines.push(
		`process_memory_heap_used_bytes ${memUsage.heapUsed} ${timestamp}`
	)

	lines.push(
		'\n# HELP process_memory_heap_total_bytes Process heap memory total in bytes'
	)
	lines.push('# TYPE process_memory_heap_total_bytes gauge')
	lines.push(
		`process_memory_heap_total_bytes ${memUsage.heapTotal} ${timestamp}`
	)

	lines.push(
		'\n# HELP process_uptime_seconds Process uptime in seconds'
	)
	lines.push('# TYPE process_uptime_seconds counter')
	lines.push(
		`process_uptime_seconds ${process.uptime().toFixed(2)} ${timestamp}`
	)

	return lines.join('\n')
}
