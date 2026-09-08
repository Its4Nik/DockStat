import { heapStats, memoryUsage } from "bun:jsc"
import os from "node:os"
import { formatBytes } from "@dockstat/utils"

let lastCpu = process.cpuUsage()
let lastTime = Bun.nanoseconds()

export function systemStats() {
  const mem = memoryUsage()
  const heap = heapStats()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()

  const now = Bun.nanoseconds()
  const cpuNow = process.cpuUsage()
  const deltaCpuUs = cpuNow.user - lastCpu.user + (cpuNow.system - lastCpu.system)
  const deltaWallUs = (now - lastTime) / 1000
  const cpuPercent = deltaWallUs > 0 ? (deltaCpuUs / deltaWallUs) * 100 : 0

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
        rss: formatBytes(mem.current),
      },
      memoryLimit: formatBytes(process.constrainedMemory() || 0),
      uptimeSec: process.uptime(),
    },
    system: {
      cpu: { cores: cpus.length, loadavg: os.loadavg(), model: cpus[0]?.model },
      memory: {
        free: formatBytes(freeMem),
        total: formatBytes(totalMem),
        used: formatBytes(totalMem - freeMem),
      },
      uptimeSec: os.uptime(),
    },
  }
}
