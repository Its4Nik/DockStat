import { heapStats, memoryUsage } from "bun:jsc"
import type { Database } from "bun:sqlite"
import { getDatabaseMetrics, metrics, persistedMetrics, summarizeDurations } from "./helper"
import type { MetricFamily } from "./prometheus"
import { renderPrometheusMetrics } from "./prometheus"

/**
 * Format metrics for Prometheus exposition format
 * This builds all metric families and renders them
 */
export function formatPrometheusFamilies(db: Database): string {
  const timestamp = Date.now()
  const families: MetricFamily[] = []

  // Request count metrics
  families.push({
    help: "Total number of HTTP requests",
    name: "http_requests_total",
    samples: [
      { labels: { scope: "session" }, timestamp, value: metrics.totalRequests },
      { labels: { scope: "total" }, timestamp, value: persistedMetrics.totalRequests },
    ],
    type: "counter",
  })

  families.push({
    help: "HTTP requests by method",
    name: "http_requests_by_method_total",
    samples: [
      ...Array.from(metrics.requestsByMethod.entries()).map(([method, count]) => ({
        labels: { method, scope: "session" },
        timestamp,
        value: count,
      })),
      ...Object.entries(persistedMetrics.requestsByMethod).map(([method, count]) => ({
        labels: { method, scope: "total" },
        timestamp,
        value: count,
      })),
    ],
    type: "counter",
  })

  families.push({
    help: "HTTP requests by path",
    name: "http_requests_by_path_total",
    samples: [
      ...Array.from(metrics.requestsByPath.entries()).map(([path, count]) => ({
        labels: { path, scope: "session" },
        timestamp,
        value: count,
      })),
      ...Object.entries(persistedMetrics.requestsByPath).map(([path, count]) => ({
        labels: { path, scope: "total" },
        timestamp,
        value: count,
      })),
    ],
    type: "counter",
  })

  families.push({
    help: "HTTP requests by status code",
    name: "http_requests_by_status_total",
    samples: [
      ...Array.from(metrics.requestsByStatus.entries()).map(([status, count]) => ({
        labels: { scope: "session", status: String(status) },
        timestamp,
        value: count,
      })),
      ...Object.entries(persistedMetrics.requestsByStatus).map(([status, count]) => ({
        labels: { scope: "total", status },
        timestamp,
        value: count,
      })),
    ],
    type: "counter",
  })

  families.push({
    help: "Total number of HTTP errors",
    name: "http_request_errors_total",
    samples: [
      { labels: { scope: "session" }, timestamp, value: metrics.errors },
      { labels: { scope: "total" }, timestamp, value: persistedMetrics.errors },
    ],
    type: "counter",
  })

  // Duration metrics
  const sessionSummary = summarizeDurations(metrics.requestDurations)
  const totalSummary = summarizeDurations(persistedMetrics.requestDurations)

  const addDurationMetrics = (
    summary: NonNullable<ReturnType<typeof summarizeDurations>>,
    scope: string
  ) => {
    families.push({
      help: "HTTP request duration in milliseconds",
      name: "http_request_duration_ms",
      samples: [
        { labels: { quantile: "0.5", scope }, timestamp, value: summary.p50.toFixed(2) },
        { labels: { quantile: "0.95", scope }, timestamp, value: summary.p95.toFixed(2) },
        { labels: { quantile: "0.99", scope }, timestamp, value: summary.p99.toFixed(2) },
      ],
      type: "summary",
    })
    families.push({
      help: "Total HTTP request duration in milliseconds",
      name: "http_request_duration_ms_sum",
      samples: [{ labels: { scope }, timestamp, value: summary.sum.toFixed(2) }],
      type: "summary",
    })
    families.push({
      help: "HTTP request duration sample count",
      name: "http_request_duration_ms_count",
      samples: [{ labels: { scope }, timestamp, value: summary.sorted.length }],
      type: "summary",
    })
  }

  if (sessionSummary) addDurationMetrics(sessionSummary, "session")
  if (totalSummary) addDurationMetrics(totalSummary, "total")

  // Database metrics
  const dbMetrics = getDatabaseMetrics(db)
  families.push({
    help: "Database file size in bytes",
    name: "database_size_bytes",
    samples: [{ timestamp, value: dbMetrics.size }],
    type: "gauge",
  })
  families.push({
    help: "Total number of database pages",
    name: "database_page_count",
    samples: [{ timestamp, value: dbMetrics.pageCount }],
    type: "gauge",
  })
  families.push({
    help: "Database page size in bytes",
    name: "database_page_size_bytes",
    samples: [{ timestamp, value: dbMetrics.pageSize }],
    type: "gauge",
  })
  families.push({
    help: "Total number of tables",
    name: "database_table_count",
    samples: [{ timestamp, value: dbMetrics.tableCount }],
    type: "gauge",
  })
  families.push({
    help: "Number of rows per table",
    name: "database_table_rows",
    samples: dbMetrics.tables.map((table) => ({
      labels: { table: table.name },
      timestamp,
      value: table.rowCount,
    })),
    type: "gauge",
  })

  // Process metrics
  const memUsage = memoryUsage().current
  const heap = heapStats()

  families.push({
    help: "Current process memory in bytes",
    name: "process_memory_bytes",
    samples: [{ timestamp, value: memUsage }],
    type: "gauge",
  })
  families.push({
    help: "Process heap memory used in bytes",
    name: "process_memory_heap_used_bytes",
    samples: [{ timestamp, value: heap.heapSize }],
    type: "gauge",
  })
  families.push({
    help: "Process heap memory total in bytes",
    name: "process_memory_heap_total_bytes",
    samples: [{ timestamp, value: heap.heapCapacity }],
    type: "gauge",
  })
  families.push({
    help: "Process uptime in seconds",
    name: "process_uptime_seconds",
    samples: [{ timestamp, value: Number(Math.floor(Bun.nanoseconds()).toFixed(2)) }],
    type: "counter",
  })

  return renderPrometheusMetrics(families, timestamp)
}
