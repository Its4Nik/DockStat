import type { PluginActions } from "@dockstat/typings"
import type { DockMonTable } from "./types"

const DockMonActions: PluginActions<DockMonTable> = {
  // Get all metrics
  getAllMetrics: ({ table }) => table?.select(["*"]).all() ?? [],

  // Get container metrics only
  getContainerMetrics: ({ table }) => table?.select(["*"]).where({ type: "CONTAINER" }).all() ?? [],

  // Get host metrics only
  getHostMetrics: ({ table }) => table?.select(["*"]).where({ type: "HOST" }).all() ?? [],

  // Get metrics for a specific host
  getMetricsByHost: ({ table, body }) => {
    const hostId = (body as { hostId?: number })?.hostId
    if (!hostId) {
      return { error: "hostId is required" }
    }
    return table?.select(["*"]).where({ host_id: hostId }).all() ?? []
  },

  // Get metrics for a specific container
  getMetricsByContainer: ({ table, body }) => {
    const containerId = (body as { containerId?: string })?.containerId
    if (!containerId) {
      return { error: "containerId is required" }
    }
    return table?.select(["*"]).where({ container_id: containerId }).all() ?? []
  },

  // Get latest host metrics (most recent entry per host)
  getLatestHostMetrics: ({ table }) => {
    const allHostMetrics = table?.select(["*"]).where({ type: "HOST" }).all() ?? []

    // Group by host_id and get the most recent
    const latestByHost = new Map<number, DockMonTable>()
    for (const metric of allHostMetrics) {
      const existing = latestByHost.get(metric.host_id)
      if (!existing || metric.stored_on > existing.stored_on) {
        latestByHost.set(metric.host_id, metric)
      }
    }

    return Array.from(latestByHost.values())
  },

  // Get latest container metrics (most recent entry per container)
  getLatestContainerMetrics: ({ table }) => {
    const allContainerMetrics = table?.select(["*"]).where({ type: "CONTAINER" }).all() ?? []

    // Group by container_id and get the most recent
    const latestByContainer = new Map<string, DockMonTable>()
    for (const metric of allContainerMetrics) {
      if (!metric.container_id) continue
      const existing = latestByContainer.get(metric.container_id)
      if (!existing || metric.stored_on > existing.stored_on) {
        latestByContainer.set(metric.container_id, metric)
      }
    }

    return Array.from(latestByContainer.values())
  },

  // Get metrics count summary
  getMetricsSummary: ({ table }) => {
    const allMetrics = table?.select(["*"]).all() ?? []
    const hostMetrics = allMetrics.filter((m) => m.type === "HOST")
    const containerMetrics = allMetrics.filter((m) => m.type === "CONTAINER")

    // Get unique hosts and containers
    const uniqueHosts = new Set(hostMetrics.map((m) => m.host_id))
    const uniqueContainers = new Set(containerMetrics.map((m) => m.container_id).filter(Boolean))

    // Get time range
    const timestamps = allMetrics.map((m) => m.stored_on).filter(Boolean)
    const oldestTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : null
    const newestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null

    return {
      totalMetrics: allMetrics.length,
      hostMetricsCount: hostMetrics.length,
      containerMetricsCount: containerMetrics.length,
      uniqueHostsCount: uniqueHosts.size,
      uniqueContainersCount: uniqueContainers.size,
      oldestTimestamp,
      newestTimestamp,
    }
  },

  // Get metrics within a time range
  getMetricsInRange: ({ table, body }) => {
    const { startTime, endTime, type } =
      (body as {
        startTime?: number
        endTime?: number
        type?: "HOST" | "CONTAINER"
      }) ?? {}

    let query = table?.select(["*"])

    if (type) {
      query = query?.where({ type })
    }

    const allMetrics = query?.all() ?? []

    // Filter by time range
    return allMetrics.filter((m) => {
      if (startTime && m.stored_on < startTime) return false
      if (endTime && m.stored_on > endTime) return false
      return true
    })
  },

  // Delete old metrics (cleanup)
  deleteOldMetrics: ({ table, body, logger }) => {
    const { olderThanDays } = (body as { olderThanDays?: number }) ?? {}
    const days = olderThanDays ?? 7

    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000
    const allMetrics = table?.select(["*"]).all() ?? []
    const oldMetrics = allMetrics.filter((m) => m.stored_on < cutoffTime)

    let deletedCount = 0
    for (const metric of oldMetrics) {
      try {
        table?.where({ id: metric.id }).delete()
        deletedCount++
      } catch (err) {
        logger.error(`Failed to delete metric ${metric.id}: ${err}`)
      }
    }

    logger.info(`Deleted ${deletedCount} metrics older than ${days} days`)
    return { deletedCount, cutoffTime }
  },

  // Get dashboard data (combined summary for frontend)
  getDashboardData: ({ table }) => {
    const allMetrics = table?.select(["*"]).all() ?? []

    // Get latest host metrics
    const hostMetrics = allMetrics.filter((m) => m.type === "HOST")
    const latestHostByHost = new Map<number, DockMonTable>()
    for (const metric of hostMetrics) {
      const existing = latestHostByHost.get(metric.host_id)
      if (!existing || metric.stored_on > existing.stored_on) {
        latestHostByHost.set(metric.host_id, metric)
      }
    }

    // Get latest container metrics
    const containerMetrics = allMetrics.filter((m) => m.type === "CONTAINER")
    const latestContainerByContainer = new Map<string, DockMonTable>()
    for (const metric of containerMetrics) {
      if (!metric.container_id) continue
      const existing = latestContainerByContainer.get(metric.container_id)
      if (!existing || metric.stored_on > existing.stored_on) {
        latestContainerByContainer.set(metric.container_id, metric)
      }
    }

    // Calculate totals from latest host metrics
    const latestHosts = Array.from(latestHostByHost.values())
    const totalContainers = latestHosts.reduce(
      (sum, h) => sum + (h.data.host_metrics?.containers ?? 0),
      0
    )
    const totalRunning = latestHosts.reduce(
      (sum, h) => sum + (h.data.host_metrics?.containersRunning ?? 0),
      0
    )
    const totalStopped = latestHosts.reduce(
      (sum, h) => sum + (h.data.host_metrics?.containersStopped ?? 0),
      0
    )
    const totalImages = latestHosts.reduce((sum, h) => sum + (h.data.host_metrics?.images ?? 0), 0)

    return {
      hosts: latestHosts.map((h) => ({
        hostId: h.host_id,
        hostName: h.data.host_metrics?.hostName ?? "Unknown",
        os: h.data.host_metrics?.os ?? "Unknown",
        architecture: h.data.host_metrics?.architecture ?? "Unknown",
        dockerVersion: h.data.host_metrics?.dockerVersion ?? "Unknown",
        containers: h.data.host_metrics?.containers ?? 0,
        containersRunning: h.data.host_metrics?.containersRunning ?? 0,
        containersStopped: h.data.host_metrics?.containersStopped ?? 0,
        images: h.data.host_metrics?.images ?? 0,
        totalMemory: h.data.host_metrics?.totalMemory ?? 0,
        totalCPU: h.data.host_metrics?.totalCPU ?? 0,
        lastUpdated: h.stored_on,
      })),
      containers: Array.from(latestContainerByContainer.values()).map((c) => ({
        containerId: c.container_id,
        hostId: c.host_id,
        name: c.data.container_metrics?.name ?? "Unknown",
        state: c.data.container_metrics?.state ?? "unknown",
        cpuUsage: c.data.container_metrics?.cpuUsage ?? 0,
        memoryUsage: c.data.container_metrics?.memoryUsage ?? 0,
        memoryLimit: c.data.container_metrics?.memoryLimit ?? 0,
        networkRx: c.data.container_metrics?.networkRx ?? 0,
        networkTx: c.data.container_metrics?.networkTx ?? 0,
        lastUpdated: c.stored_on,
      })),
      summary: {
        totalHosts: latestHosts.length,
        totalContainers,
        totalRunning,
        totalStopped,
        totalImages,
        metricsCollected: allMetrics.length,
      },
    }
  },
}

export default DockMonActions
