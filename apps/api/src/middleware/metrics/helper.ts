import { heapStats, memoryUsage } from "bun:jsc"
import type { Database } from "bun:sqlite"
import { truncate } from "@dockstat/utils"
import type { Elysia } from "elysia"
import { DockStatDB } from "../../database"
import BaseLogger from "../../logger"
import { type MetricFamily, renderPrometheusMetrics } from "./prometheus"

/**
 * In-memory metrics (current server session)
 */
interface RequestMetrics {
  totalRequests: number
  requestsByMethod: Map<string, number>
  requestsByPath: Map<string, number>
  requestsByStatus: Map<number, number>
  requestDurations: number[]
  errors: number
}

/**
 * Serializable version for JSON columns (no Map keys)
 */
interface SerializableRequestMetrics {
  totalRequests: number
  requestsByMethod: Record<string, number>
  requestsByPath: Record<string, number>
  requestsByStatus: Record<string, number>
  requestDurations: number[]
  errors: number
}

interface MetricsRow extends SerializableRequestMetrics, Record<string, unknown> {
  id: number
}

const MetricsTable = DockStatDB._sqliteWrapper.table<MetricsRow>("metrics", {
  JSON: ["requestsByMethod", "requestsByPath", "requestsByStatus", "requestDurations"],
})

const logger = BaseLogger.spawn("Metrics")

/**
 * Helpers to create empty metrics
 */
function createEmptyRequestMetrics(): RequestMetrics {
  return {
    totalRequests: 0,
    requestsByMethod: new Map(),
    requestsByPath: new Map(),
    requestsByStatus: new Map(),
    requestDurations: [],
    errors: 0,
  }
}

function createEmptySerializableMetrics(): SerializableRequestMetrics {
  return {
    totalRequests: 0,
    requestsByMethod: {},
    requestsByPath: {},
    requestsByStatus: {},
    requestDurations: [],
    errors: 0,
  }
}

/**
 * Global in-memory metrics (current server session)
 */
const metrics: RequestMetrics = createEmptyRequestMetrics()

/**
 * Persisted metrics (backed by DB)
 */
let persistedMetrics: SerializableRequestMetrics = createEmptySerializableMetrics()
let persistedMetricsId: number | null = null

/**
 * Initialize/load the single metrics row from DB (or create it)
 */
function initPersistedMetrics() {
  if (persistedMetricsId !== null) return

  try {
    const existing = MetricsTable.all()[0]

    if (existing) {
      persistedMetricsId = existing.id
      persistedMetrics = {
        totalRequests: existing.totalRequests ?? 0,
        requestsByMethod: existing.requestsByMethod ?? {},
        requestsByPath: existing.requestsByPath ?? {},
        requestsByStatus: existing.requestsByStatus ?? {},
        requestDurations: existing.requestDurations ?? [],
        errors: existing.errors ?? 0,
      }
    } else {
      const empty = createEmptySerializableMetrics()
      const result = MetricsTable.insert({
        totalRequests: empty.totalRequests,
        requestsByMethod: empty.requestsByMethod,
        requestsByPath: empty.requestsByPath,
        requestsByStatus: empty.requestsByStatus,
        requestDurations: empty.requestDurations,
        errors: empty.errors,
      })
      persistedMetrics = empty
      const id = result.insertId
      persistedMetricsId = Number(id ?? 1)
    }
  } catch (err) {
    console.error("Failed to init persisted metrics:", err)
    // Fall back to in-memory only
    persistedMetricsId = null
  }
}

/**
 * Persist current `persistedMetrics` into DB
 */
function savePersistedMetrics() {
  if (persistedMetricsId === null) {
    initPersistedMetrics()
    if (persistedMetricsId === null) return
  }

  try {
    MetricsTable.where({
      id: persistedMetricsId,
    }).update({
      totalRequests: persistedMetrics.totalRequests,
      requestsByMethod: persistedMetrics.requestsByMethod,
      requestsByPath: persistedMetrics.requestsByPath,
      requestsByStatus: persistedMetrics.requestsByStatus,
      requestDurations: persistedMetrics.requestDurations,
      errors: persistedMetrics.errors,
    })
  } catch (err) {
    console.error("Failed to save persisted metrics:", err)
  }
}

/**
 * Helpers for updating persisted metrics safely
 */
function incPersisted(obj: Record<string, number>, key: string) {
  obj[key] = (obj[key] ?? 0) + 1
}

function trackDuration(durations: number[], duration: number, max = 1000) {
  durations.push(duration)
  if (durations.length > max) durations.shift()
}

const MetricsMiddleware = (app: Elysia) => {
  // Ensure persisted metrics row is ready
  initPersistedMetrics()

  return app
    .state("startTime", 0)
    .onBeforeHandle(
      {
        as: "global",
      },
      ({ store, headers }) => {
        store.startTime = performance.now()
        logger.debug(`Started performance tracking`, headers["x-dockstatapi-reqid"])
      }
    )
    .onAfterResponse(
      {
        as: "global",
      },
      ({ request, responseValue, store, headers }) => {
        const duration = performance.now() - (store.startTime || 0)
        const method = request.method
        const path = new URL(request.url).pathname

        logger.debug(
          `[${method}] Took ${Math.round(duration)}ms on ${path}`,
          headers["x-dockstatapi-reqid"] ?? undefined
        )

        if (path === "/api/metrics") {
          logger.debug(`Skipped path: ${path}`, headers["x-dockstatapi-reqid"] ?? undefined)
        } else {
          // ---- SESSION METRICS ----
          metrics.totalRequests++

          metrics.requestsByMethod.set(method, (metrics.requestsByMethod.get(method) || 0) + 1)

          metrics.requestsByPath.set(path, (metrics.requestsByPath.get(path) || 0) + 1)

          const status =
            (
              responseValue as {
                status?: number
              }
            )?.status || 200
          metrics.requestsByStatus.set(status, (metrics.requestsByStatus.get(status) || 0) + 1)

          trackDuration(metrics.requestDurations, duration)

          // ---- PERSISTED / TOTAL METRICS ----
          persistedMetrics.totalRequests++

          incPersisted(persistedMetrics.requestsByMethod, method)
          incPersisted(persistedMetrics.requestsByPath, path)
          incPersisted(persistedMetrics.requestsByStatus, String(status))
          trackDuration(persistedMetrics.requestDurations, duration)

          // Persist to DB
          savePersistedMetrics()
        }

        logger.info(
          `Request on ${new URL(request.url).pathname} finished`,
          headers["x-dockstatapi-reqid"] ?? undefined
        )
      }
    )
    .onError(
      {
        as: "global",
      },
      ({ store, headers, error }) => {
        const duration = performance.now() - (store.startTime || 0)

        // Session metrics
        metrics.errors++
        trackDuration(metrics.requestDurations, duration)

        // Persisted metrics
        persistedMetrics.errors++
        trackDuration(persistedMetrics.requestDurations, duration)
        savePersistedMetrics()

        // Better error serialization to handle Error objects properly
        const errorDetails =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
              }
            : error

        logger.error(
          `Tracked Error: ${truncate(JSON.stringify(errorDetails), 100)}`,
          headers["x-dockstatapi-reqid"] || undefined
        )
      }
    )
}

// Database metrics collector (unchanged)
function getDatabaseMetrics(db: Database) {
  const dbMetrics = {
    size: 0,
    pageCount: 0,
    pageSize: 0,
    tableCount: 0,
    tables: [] as Array<{
      name: string
      rowCount: number
    }>,
  }

  try {
    const sizeQuery = db.query(
      "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
    )
    const sizeResult: {
      size?: number
    } = sizeQuery.get() as {
      size?: number
    }
    dbMetrics.size = sizeResult?.size || 0

    const pageCountQuery = db.query("PRAGMA page_count")
    const pageCountResult = pageCountQuery.get() as {
      page_count?: number
    }
    dbMetrics.pageCount = pageCountResult?.page_count || 0

    const pageSizeQuery = db.query("PRAGMA page_size")
    const pageSizeResult = pageSizeQuery.get() as {
      page_size?: number
    }
    dbMetrics.pageSize = pageSizeResult?.page_size || 0

    const tablesQuery = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    const tables = tablesQuery.all() as Array<{
      name: string
    }>
    dbMetrics.tableCount = tables.length

    for (const table of tables) {
      try {
        const countQuery = db.query(`SELECT COUNT(*) as count FROM "${table.name}"`)
        const countResult = countQuery.get() as {
          count?: number
        }
        dbMetrics.tables.push({
          name: table.name,
          rowCount: countResult?.count || 0,
        })
      } catch (_) {
        // Skip tables we can't read
      }
    }
  } catch (error) {
    console.error("Error collecting database metrics:", error)
  }

  return dbMetrics
}

/**
 * Helper to compute summary stats from a duration array
 */
function summarizeDurations(durations: number[]) {
  if (!durations.length) return null

  const sorted = [...durations].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const avg = sum / sorted.length
  const p50 = sorted[Math.floor(sorted.length * 0.5)]
  const p95 = sorted[Math.floor(sorted.length * 0.95)]
  const p99 = sorted[Math.floor(sorted.length * 0.99)]

  return {
    sorted,
    sum,
    avg,
    p50,
    p95,
    p99,
  }
}

export function formatPrometheusMetrics(db: Database) {
  initPersistedMetrics()

  const timestamp = Date.now()
  const families: MetricFamily[] = []

  families.push({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    type: "counter",
    samples: [
      {
        labels: {
          scope: "session",
        },
        value: metrics.totalRequests,
        timestamp,
      },
      {
        labels: {
          scope: "total",
        },
        value: persistedMetrics.totalRequests,
        timestamp,
      },
    ],
  })

  // --- REPLACEMENT for http_requests_by_method_total block ---
  families.push({
    name: "http_requests_by_method_total",
    help: "HTTP requests by method",
    type: "counter",
    samples: [
      // session
      ...Array.from(metrics.requestsByMethod.entries()).map(([method, count]) => ({
        labels: {
          method,
          scope: "session",
        },
        value: count,
        timestamp,
      })),
      // total (persisted)
      ...Object.entries(persistedMetrics.requestsByMethod).map(([method, count]) => ({
        labels: {
          method,
          scope: "total",
        },
        value: count,
        timestamp,
      })),
    ],
  })

  families.push({
    name: "http_requests_by_path_total",
    help: "HTTP requests by path",
    type: "counter",
    samples: [
      ...Array.from(metrics.requestsByPath.entries()).map(([path, count]) => ({
        labels: {
          path,
          scope: "session",
        },
        value: count,
        timestamp,
      })),
      ...Object.entries(persistedMetrics.requestsByPath).map(([path, count]) => ({
        labels: {
          path,
          scope: "total",
        },
        value: count,
        timestamp,
      })),
    ],
  })

  families.push({
    name: "http_requests_by_status_total",
    help: "HTTP requests by status code",
    type: "counter",
    samples: [
      ...Array.from(metrics.requestsByStatus.entries()).map(([status, count]) => ({
        labels: {
          status: String(status),
          scope: "session",
        },
        value: count,
        timestamp,
      })),
      ...Object.entries(persistedMetrics.requestsByStatus).map(([status, count]) => ({
        labels: {
          status,
          scope: "total",
        },
        value: count,
        timestamp,
      })),
    ],
  })

  families.push({
    name: "http_request_errors_total",
    help: "Total number of HTTP errors",
    type: "counter",
    samples: [
      {
        labels: {
          scope: "session",
        },
        value: metrics.errors,
        timestamp,
      },
      {
        labels: {
          scope: "total",
        },
        value: persistedMetrics.errors,
        timestamp,
      },
    ],
  })

  // ---------- DURATION METRICS ----------

  const sessionSummary = summarizeDurations(metrics.requestDurations)
  const totalSummary = summarizeDurations(persistedMetrics.requestDurations)

  if (sessionSummary) {
    families.push({
      name: "http_request_duration_ms",
      help: "HTTP request duration in milliseconds",
      type: "summary",
      samples: [
        {
          labels: {
            quantile: "0.5",
            scope: "session",
          },
          value: sessionSummary.p50.toFixed(2),
          timestamp,
        },
        {
          labels: {
            quantile: "0.95",
            scope: "session",
          },
          value: sessionSummary.p95.toFixed(2),
          timestamp,
        },
        {
          labels: {
            quantile: "0.99",
            scope: "session",
          },
          value: sessionSummary.p99.toFixed(2),
          timestamp,
        },
      ],
    })

    families.push({
      name: "http_request_duration_ms_sum",
      help: "Total HTTP request duration in milliseconds",
      type: "summary",
      samples: [
        {
          labels: {
            scope: "session",
          },
          value: sessionSummary.sum.toFixed(2),
          timestamp,
        },
      ],
    })

    families.push({
      name: "http_request_duration_ms_count",
      help: "HTTP request duration sample count",
      type: "summary",
      samples: [
        {
          labels: {
            scope: "session",
          },
          value: sessionSummary.sorted.length,
          timestamp,
        },
      ],
    })
  }

  if (totalSummary) {
    families.push({
      name: "http_request_duration_ms",
      help: "HTTP request duration in milliseconds",
      type: "summary",
      samples: [
        {
          labels: {
            quantile: "0.5",
            scope: "total",
          },
          value: totalSummary.p50.toFixed(2),
          timestamp,
        },
        {
          labels: {
            quantile: "0.95",
            scope: "total",
          },
          value: totalSummary.p95.toFixed(2),
          timestamp,
        },
        {
          labels: {
            quantile: "0.99",
            scope: "total",
          },
          value: totalSummary.p99.toFixed(2),
          timestamp,
        },
      ],
    })

    families.push({
      name: "http_request_duration_ms_sum",
      help: "Total HTTP request duration in milliseconds",
      type: "summary",
      samples: [
        {
          labels: {
            scope: "total",
          },
          value: totalSummary.sum.toFixed(2),
          timestamp,
        },
      ],
    })

    families.push({
      name: "http_request_duration_ms_count",
      help: "HTTP request duration sample count",
      type: "summary",
      samples: [
        {
          labels: {
            scope: "total",
          },
          value: totalSummary.sorted.length,
          timestamp,
        },
      ],
    })
  }

  // ---------- DATABASE METRICS ----------

  const dbMetrics = getDatabaseMetrics(db)

  families.push({
    name: "database_size_bytes",
    help: "Database file size in bytes",
    type: "gauge",
    samples: [
      {
        value: dbMetrics.size,
        timestamp,
      },
    ],
  })

  families.push({
    name: "database_page_count",
    help: "Total number of database pages",
    type: "gauge",
    samples: [
      {
        value: dbMetrics.pageCount,
        timestamp,
      },
    ],
  })

  families.push({
    name: "database_page_size_bytes",
    help: "Database page size in bytes",
    type: "gauge",
    samples: [
      {
        value: dbMetrics.pageSize,
        timestamp,
      },
    ],
  })

  families.push({
    name: "database_table_count",
    help: "Total number of tables",
    type: "gauge",
    samples: [
      {
        value: dbMetrics.tableCount,
        timestamp,
      },
    ],
  })

  families.push({
    name: "database_table_rows",
    help: "Number of rows per table",
    type: "gauge",
    samples: dbMetrics.tables.map((table) => ({
      labels: {
        table: table.name,
      },
      value: table.rowCount,
      timestamp,
    })),
  })

  // ---------- PROCESS METRICS ----------

  const memUsage = memoryUsage().current
  const heap = heapStats()

  families.push({
    name: "process_memory_bytes",
    help: "Current process memory in bytes",
    type: "gauge",
    samples: [
      {
        value: memUsage,
        timestamp,
      },
    ],
  })

  families.push({
    name: "process_memory_heap_used_bytes",
    help: "Process heap memory used in bytes",
    type: "gauge",
    samples: [
      {
        value: heap.heapSize,
        timestamp,
      },
    ],
  })

  families.push({
    name: "process_memory_heap_total_bytes",
    help: "Process heap memory total in bytes",
    type: "gauge",
    samples: [
      {
        value: heap.heapCapacity,
        timestamp,
      },
    ],
  })

  families.push({
    name: "process_uptime_seconds",
    help: "Process uptime in seconds",
    type: "counter",
    samples: [
      {
        value: Number(Math.floor(Bun.nanoseconds()).toFixed(2)),
        timestamp,
      },
    ],
  })

  return renderPrometheusMetrics(families, timestamp)
}

export default MetricsMiddleware
