import type { Database } from "bun:sqlite"
import { stateMap } from "@dockstat/api/handlers/requestLogger"
import { truncate } from "@dockstat/utils"
import type { Elysia } from "elysia"
import { DockStatDB } from "../../database"
import BaseLogger from "../../logger"

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

function createEmptyRequestMetrics(): RequestMetrics {
  return {
    errors: 0,
    requestDurations: [],
    requestsByMethod: new Map(),
    requestsByPath: new Map(),
    requestsByStatus: new Map(),
    totalRequests: 0,
  }
}

function createEmptySerializableMetrics(): SerializableRequestMetrics {
  return {
    errors: 0,
    requestDurations: [],
    requestsByMethod: {},
    requestsByPath: {},
    requestsByStatus: {},
    totalRequests: 0,
  }
}

const metrics: RequestMetrics = createEmptyRequestMetrics()
let persistedMetrics: SerializableRequestMetrics = createEmptySerializableMetrics()
let persistedMetricsId: number | null = null

function initPersistedMetrics() {
  if (persistedMetricsId !== null) return

  try {
    const existing = MetricsTable.all()[0]

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
      const empty = createEmptySerializableMetrics()
      const result = MetricsTable.insert({
        errors: empty.errors,
        requestDurations: empty.requestDurations,
        requestsByMethod: empty.requestsByMethod,
        requestsByPath: empty.requestsByPath,
        requestsByStatus: empty.requestsByStatus,
        totalRequests: empty.totalRequests,
      })
      persistedMetrics = empty
      const id = result.insertId
      persistedMetricsId = Number(id ?? 1)
    }
  } catch (err) {
    logger.error(`Failed to init persisted metrics: ${(err as Error).toString()}`)
    persistedMetricsId = null
  }
}

function savePersistedMetrics() {
  if (persistedMetricsId === null) {
    initPersistedMetrics()
    if (persistedMetricsId === null) return
  }

  try {
    MetricsTable.where({
      id: persistedMetricsId,
    }).update({
      errors: persistedMetrics.errors,
      requestDurations: persistedMetrics.requestDurations,
      requestsByMethod: persistedMetrics.requestsByMethod,
      requestsByPath: persistedMetrics.requestsByPath,
      requestsByStatus: persistedMetrics.requestsByStatus,
      totalRequests: persistedMetrics.totalRequests,
    })
  } catch (err) {
    logger.error(`Failed to save persisted metrics: ${(err as Error).toString()}`)
  }
}

function incPersisted(obj: Record<string, number>, key: string) {
  obj[key] = (obj[key] ?? 0) + 1
}

function trackDuration(durations: number[], duration: number, max = 1000) {
  durations.push(duration)
  if (durations.length > max) durations.shift()
}

const MetricsMiddleware = (app: Elysia) => {
  initPersistedMetrics()

  return app
    .state("startTime", 0)
    .onBeforeHandle({ as: "global" }, ({ store, headers }) => {
      store.startTime = performance.now()
      logger.debug(`Started performance tracking`, headers?.["x-dockstatapi-reqid"])
    })
    .onAfterResponse({ as: "global" }, ({ request, responseValue, store }) => {
      const reqId = stateMap.get(request)?.reqId
      const duration = performance.now() - (store.startTime || 0)
      const method = request.method
      const path = new URL(request.url).pathname

      logger.debug(`[${method}] Took ${Math.round(duration)}ms on ${path}`, reqId)

      if (path === "/api/metrics") {
        logger.debug(`Skipped path: ${path}`, reqId)
      } else {
        metrics.totalRequests++
        metrics.requestsByMethod.set(method, (metrics.requestsByMethod.get(method) || 0) + 1)
        metrics.requestsByPath.set(path, (metrics.requestsByPath.get(path) || 0) + 1)
        const status = (responseValue as { status?: number })?.status || 200
        metrics.requestsByStatus.set(status, (metrics.requestsByStatus.get(status) || 0) + 1)
        trackDuration(metrics.requestDurations, duration)

        persistedMetrics.totalRequests++
        incPersisted(persistedMetrics.requestsByMethod, method)
        incPersisted(persistedMetrics.requestsByPath, path)
        incPersisted(persistedMetrics.requestsByStatus, String(status))
        trackDuration(persistedMetrics.requestDurations, duration)

        savePersistedMetrics()
      }

      logger.info(`Request on ${new URL(request.url).pathname} finished`, reqId)
    })
    .onError({ as: "global" }, ({ store, error, request }) => {
      const duration = performance.now() - (store.startTime || 0)
      const reqId = stateMap.get(request)?.reqId

      metrics.errors++
      trackDuration(metrics.requestDurations, duration)

      persistedMetrics.errors++
      trackDuration(persistedMetrics.requestDurations, duration)
      savePersistedMetrics()

      const errorDetails =
        error instanceof Error
          ? { cause: error.cause, message: error.message, name: error.name, stack: error.stack }
          : error

      logger.debug(`Tracked Error: ${truncate(JSON.stringify(errorDetails), 100)}`, reqId)
    })
}

/**
 * Database metrics collector
 */
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
      } catch (_) {
        // Skip tables we can't read
      }
    }
  } catch (error) {
    logger.error(`Error collecting database metrics: ${(error as Error).toString()}`)
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

  return {
    avg: sum / sorted.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    sorted,
    sum,
  }
}

export { MetricsMiddleware, getDatabaseMetrics, metrics, persistedMetrics, summarizeDurations }
export default MetricsMiddleware
