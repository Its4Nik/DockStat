import { heapStats, memoryUsage } from "bun:jsc"
import type { Database } from "bun:sqlite"
import type { DB, QueryBuilder } from "@dockstat/sqlite-wrapper"

interface RequestMetrics {
  totalRequests: number
  requestsByMethod: Map<string, number>
  requestsByPath: Map<string, number>
  requestsByStatus: Map<number, number>
  requestDurations: number[]
  errors: number
}

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

const metrics: RequestMetrics = {
  errors: 0,
  requestDurations: [],
  requestsByMethod: new Map(),
  requestsByPath: new Map(),
  requestsByStatus: new Map(),
  totalRequests: 0,
}

let persistedMetrics: SerializableRequestMetrics = {
  errors: 0,
  requestDurations: [],
  requestsByMethod: {},
  requestsByPath: {},
  requestsByStatus: {},
  totalRequests: 0,
}
let persistedMetricsId: number | null = null

const inc = (obj: Record<string, number>, key: string) => {
  obj[key] = (obj[key] ?? 0) + 1
}

const trackDuration = (durations: number[], duration: number, max = 1000) => {
  durations.push(duration)
  if (durations.length > max) durations.shift()
}

export class MetricsRecorder {
  private table: QueryBuilder<MetricsRow>

  constructor(db: DB) {
    this.table = db.table<MetricsRow>("metrics", {
      JSON: ["requestsByMethod", "requestsByPath", "requestsByStatus", "requestDurations"],
    })

    const existing = (this.table.all() as MetricsRow[])[0]
    if (existing) {
      persistedMetricsId = existing.id
      persistedMetrics = {
        errors: existing.errors ?? 0,
        requestDurations: existing.requestDurations ?? [],
        requestsByMethod: existing.requestsByMethod ?? {},
        requestsByPath: existing.requestsByPath ?? {},
        requestsByStatus: existing.requestsByStatus ?? {},
        totalRequests: existing.totalRequests ?? 0,
      }
    } else {
      const empty = { ...persistedMetrics }
      const result = this.table.insert(empty)
      persistedMetricsId = Number(result.insertId ?? 1)
    }
  }

  record(method: string, path: string, status: number, durationMs: number, isError = false) {
    metrics.totalRequests++
    metrics.requestsByMethod.set(method, (metrics.requestsByMethod.get(method) ?? 0) + 1)
    metrics.requestsByPath.set(path, (metrics.requestsByPath.get(path) ?? 0) + 1)
    metrics.requestsByStatus.set(status, (metrics.requestsByStatus.get(status) ?? 0) + 1)
    trackDuration(metrics.requestDurations, durationMs)
    if (isError) metrics.errors++

    persistedMetrics.totalRequests++
    inc(persistedMetrics.requestsByMethod, method)
    inc(persistedMetrics.requestsByPath, path)
    inc(persistedMetrics.requestsByStatus, String(status))
    trackDuration(persistedMetrics.requestDurations, durationMs)
    if (isError) persistedMetrics.errors++

    this.persist()
  }

  private persist() {
    if (persistedMetricsId === null) return
    try {
      this.table.where({ id: persistedMetricsId }).update({
        errors: persistedMetrics.errors,
        requestDurations: persistedMetrics.requestDurations,
        requestsByMethod: persistedMetrics.requestsByMethod,
        requestsByPath: persistedMetrics.requestsByPath,
        requestsByStatus: persistedMetrics.requestsByStatus,
        totalRequests: persistedMetrics.totalRequests,
      })
    } catch {
      // metrics persistence is best-effort
    }
  }
}

// ── Prometheus exposition ───────────────────────────────────────────

type MetricType = "counter" | "gauge" | "summary"

interface MetricSample {
  labels?: Record<string, string>
  value: number | string
  timestamp?: number
}

interface MetricFamily {
  name: string
  help: string
  type: MetricType
  samples: MetricSample[]
}

function summarizeDurations(durations: number[]) {
  if (!durations.length) return null
  const sorted = [...durations].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  return {
    avg: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    sorted,
    sum,
  }
}

function getDatabaseMetrics(db: Database) {
  const dbMetrics = {
    pageCount: 0,
    pageSize: 0,
    size: 0,
    tableCount: 0,
    tables: [] as Array<{ name: string; rowCount: number }>,
  }

  try {
    const sizeResult = db
      .query("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
      .get() as { size?: number }
    dbMetrics.size = sizeResult?.size || 0
    dbMetrics.pageCount =
      (db.query("PRAGMA page_count").get() as { page_count?: number })?.page_count || 0
    dbMetrics.pageSize =
      (db.query("PRAGMA page_size").get() as { page_size?: number })?.page_size || 0

    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>
    dbMetrics.tableCount = tables.length

    for (const table of tables) {
      try {
        const count = db.query(`SELECT COUNT(*) as count FROM "${table.name}"`).get() as {
          count?: number
        }
        dbMetrics.tables.push({ name: table.name, rowCount: count?.count || 0 })
      } catch {
        // Skip tables we can't read
      }
    }
  } catch {
    // ignore
  }

  return dbMetrics
}

export function formatPrometheusMetrics(db: Database): string {
  const timestamp = Date.now()
  const families: MetricFamily[] = []

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

  const addDurationMetrics = (
    summary: NonNullable<ReturnType<typeof summarizeDurations>>,
    scope: string
  ) => {
    families.push(
      {
        help: "HTTP request duration in milliseconds",
        name: "http_request_duration_ms",
        samples: [
          { labels: { quantile: "0.5", scope }, timestamp, value: summary.p50.toFixed(2) },
          { labels: { quantile: "0.95", scope }, timestamp, value: summary.p95.toFixed(2) },
          { labels: { quantile: "0.99", scope }, timestamp, value: summary.p99.toFixed(2) },
        ],
        type: "summary",
      },
      {
        help: "Total HTTP request duration in milliseconds",
        name: "http_request_duration_ms_sum",
        samples: [{ labels: { scope }, timestamp, value: summary.sum.toFixed(2) }],
        type: "summary",
      },
      {
        help: "HTTP request duration sample count",
        name: "http_request_duration_ms_count",
        samples: [{ labels: { scope }, timestamp, value: summary.sorted.length }],
        type: "summary",
      }
    )
  }

  const sessionSummary = summarizeDurations(metrics.requestDurations)
  const totalSummary = summarizeDurations(persistedMetrics.requestDurations)
  if (sessionSummary) addDurationMetrics(sessionSummary, "session")
  if (totalSummary) addDurationMetrics(totalSummary, "total")

  const dbMetrics = getDatabaseMetrics(db)
  families.push(
    {
      help: "Database file size in bytes",
      name: "database_size_bytes",
      samples: [{ timestamp, value: dbMetrics.size }],
      type: "gauge",
    },
    {
      help: "Total number of database pages",
      name: "database_page_count",
      samples: [{ timestamp, value: dbMetrics.pageCount }],
      type: "gauge",
    },
    {
      help: "Database page size in bytes",
      name: "database_page_size_bytes",
      samples: [{ timestamp, value: dbMetrics.pageSize }],
      type: "gauge",
    },
    {
      help: "Total number of tables",
      name: "database_table_count",
      samples: [{ timestamp, value: dbMetrics.tableCount }],
      type: "gauge",
    },
    {
      help: "Number of rows per table",
      name: "database_table_rows",
      samples: dbMetrics.tables.map((table) => ({
        labels: { table: table.name },
        timestamp,
        value: table.rowCount,
      })),
      type: "gauge",
    }
  )

  const mem = memoryUsage().current
  const heap = heapStats()
  families.push(
    {
      help: "Current process memory in bytes",
      name: "process_memory_bytes",
      samples: [{ timestamp, value: mem }],
      type: "gauge",
    },
    {
      help: "Process heap memory used in bytes",
      name: "process_memory_heap_used_bytes",
      samples: [{ timestamp, value: heap.heapSize }],
      type: "gauge",
    },
    {
      help: "Process heap memory total in bytes",
      name: "process_memory_heap_total_bytes",
      samples: [{ timestamp, value: heap.heapCapacity }],
      type: "gauge",
    },
    {
      help: "Process uptime in nanoseconds",
      name: "process_uptime_nanoseconds",
      samples: [{ timestamp, value: Bun.nanoseconds() }],
      type: "counter",
    }
  )

  const lines: string[] = []
  for (const family of families) {
    lines.push(`# HELP ${family.name} ${family.help}`)
    lines.push(`# TYPE ${family.name} ${family.type}`)
    for (const sample of family.samples) {
      const labels = sample.labels
        ? `{${Object.entries(sample.labels)
            .map(([key, value]) => `${key}="${String(value)}"`)
            .join(",")}}`
        : ""
      lines.push(`${family.name}${labels} ${sample.value} ${sample.timestamp ?? timestamp}`)
    }
    lines.push("")
  }
  return lines.join("\n")
}
