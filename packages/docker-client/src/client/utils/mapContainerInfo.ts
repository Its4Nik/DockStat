import type { DOCKER } from "@dockstat/typings"
import type Dockerode from "dockerode"

export function mapContainerInfo(
  container: Dockerode.ContainerInfo,
  hostId: number
): DOCKER.ContainerInfo {
  return {
    id: container.Id,
    hostId,
    name: container.Names[0]?.replace("/", "") || "unknown",
    image: container.Image,
    status: container.Status,
    state: container.State,
    created: container.Created,
    ports: container.Ports.map((port) => ({
      privatePort: port.PrivatePort,
      publicPort: port.PublicPort,
      type: port.Type,
    })),
    labels: container.Labels || {},
    networkSettings: container.NetworkSettings
      ? { networks: container.NetworkSettings.Networks || {} }
      : undefined,
  }
}

export function mapContainerInfoFromInspect(
  containerInfo: Dockerode.ContainerInspectInfo,
  hostId: number
): DOCKER.ContainerInfo {
  return {
    id: containerInfo.Id,
    hostId,
    name: containerInfo.Name.replace("/", ""),
    image: containerInfo.Config.Image,
    status: containerInfo.State.Status,
    state: containerInfo.State.Status,
    created: Math.floor(new Date(containerInfo.Created).getTime() / 1000),
    ports: Object.entries(containerInfo.NetworkSettings.Ports || {}).map(([port, bindings]) => ({
      privatePort: Number.parseInt(String(port.split("/")[0]), 10),
      publicPort: bindings?.[0]?.HostPort ? Number.parseInt(bindings[0].HostPort, 10) : undefined,
      type: port.split("/")[1] || "tcp",
    })),
    labels: containerInfo.Config.Labels || {},
    networkSettings: {
      networks: containerInfo.NetworkSettings.Networks || {},
    },
  }
}

export function mapContainerStats(
  containerInfo: DOCKER.ContainerInfo,
  stats: Dockerode.ContainerStats
): DOCKER.ContainerStatsInfo {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats?.cpu_usage?.total_usage || 0)
  const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats?.system_cpu_usage || 0)
  const cpuUsage =
    systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0

  const memoryUsage = stats.memory_stats.usage || 0
  const memoryLimit = stats.memory_stats.limit || 0

  let networkRx = 0
  let networkTx = 0

  if (stats.networks) {
    for (const network of Object.values(stats.networks)) {
      networkRx += network.rx_bytes || 0
      networkTx += network.tx_bytes || 0
    }
  }

  const blockRead =
    stats.blkio_stats?.io_service_bytes_recursive?.find((stat) => stat.op === "Read")?.value || 0

  const blockWrite =
    stats.blkio_stats?.io_service_bytes_recursive?.find((stat) => stat.op === "Write")?.value || 0

  return {
    ...containerInfo,
    stats,
    cpuUsage: Math.round(cpuUsage * 100) / 100,
    memoryUsage,
    memoryLimit,
    networkRx,
    networkTx,
    blockRead,
    blockWrite,
  }
}
