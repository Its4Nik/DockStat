import os from "node:os"
import { formatBytes } from "@dockstat/utils"
import Elysia from "elysia"
import PrometheusMetricsRoute from "../metrics/prometheus"

let lastCpu = process.cpuUsage()
let lastTime = performance.now()

const DockStatMiscRoutes = new Elysia({ prefix: "/misc", detail: { tags: ["Misc"] } })
  .use(PrometheusMetricsRoute)
  .get("/stats", () => {
    const mem = process.memoryUsage()
    const rssBytes = mem.rss

    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem

    const now = performance.now()
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
        uptimeSec: process.uptime(),
        memory: {
          rss: formatBytes(rssBytes),
          heapTotal: formatBytes(mem.heapTotal),
          heapUsed: formatBytes(mem.heapUsed),
          external: formatBytes(mem.external),
          arrayBuffers: formatBytes(mem.arrayBuffers),
        },
        cpu: {
          userMs: cpuNow.user / 1000,
          systemMs: cpuNow.system / 1000,
          percentSinceLastCall: Number(cpuPercent.toFixed(2)),
        },
        memoryLimit: formatBytes(process.constrainedMemory()),
      },
      system: {
        uptimeSec: os.uptime(),
        memory: {
          total: formatBytes(totalMem),
          used: formatBytes(usedMem),
          free: formatBytes(freeMem),
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model,
          loadavg: os.loadavg(),
        },
      },
    }
  })

export default DockStatMiscRoutes
