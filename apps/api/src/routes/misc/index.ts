import { heapStats, memoryUsage } from "bun:jsc"
import os from "node:os"
import { formatBytes } from "@dockstat/utils"
import Elysia from "elysia"
import PrometheusMetricsRoute from "../metrics/prometheus"

let lastCpu = process.cpuUsage()
let lastTime = Bun.nanoseconds()

const DockStatMiscRoutes = new Elysia({
  detail: { tags: ["Misc"] },
  prefix: "/misc",
})
  .use(PrometheusMetricsRoute)
  .get("/stats", () => {
    const mem = memoryUsage()
    const heap = heapStats()
    const rssBytes = mem.current

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const now = Bun.nanoseconds()
    const cpuNow = process.cpuUsage()

    const deltaUserUs = cpuNow.user - lastCpu.user
    const deltaSystemUs = cpuNow.system - lastCpu.system
    const deltaCpuUs = deltaUserUs + deltaSystemUs

    const deltaWallMs = now - lastTime
    const cpuPercent = deltaWallMs > 0 ? (deltaCpuUs / 1000 / deltaWallMs) * 100 : 0

    lastCpu = cpuNow
    lastTime = now

    const cpus = os.cpus()

    return {
      process: {
        cpu: {
          percentSinceLastCall: Number(cpuPercent.toFixed(2)),
          systemMs: cpuNow.system / 1000,
          userMs: cpuNow.user / 1000,
        },
        memory: {
          external: formatBytes(heap.globalObjectCount),
          heapTotal: formatBytes(heap.heapCapacity),
          heapUsed: formatBytes(heap.heapSize),
          rss: formatBytes(rssBytes),
        },
        memoryLimit: formatBytes(process.constrainedMemory() || 0),
        uptimeSec: process.uptime(),
      },
      system: {
        cpu: {
          cores: cpus.length,
          loadavg: os.loadavg(),
          model: cpus[0]?.model,
        },
        memory: {
          free: formatBytes(freeMem),
          total: formatBytes(totalMem),
          used: formatBytes(usedMem),
        },
        uptimeSec: os.uptime(),
      },
    }
  })

export default DockStatMiscRoutes
