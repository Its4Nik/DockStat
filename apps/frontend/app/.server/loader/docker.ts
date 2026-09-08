import { dockerCache } from "../cache"
import type { RouteArgs } from "../lib/http"
import Singletons from "../singletons"

export const DockerLoaders = {
  getAllClients: ({ params }: RouteArgs<{ stored?: string }>) =>
    Singletons.Docker.getAllClients(params.stored === "true"),
  getAllContainerStats: () =>
    dockerCache.getOrComputeAsync("all-containers", () =>
      Singletons.Docker.getAllContainerStats()
    ),
  getAllHosts: () => Singletons.Docker.getAllHosts(),
  getCachedContainers: ({ params }: RouteArgs<{ clientId: string }>) =>
    dockerCache.getOrComputeAsync(`client-${params.clientId}-containers`, () =>
      Singletons.Docker.getAllContainers(Number(params.clientId))
    ),
  getContainers: ({ params }: RouteArgs<{ clientId: string }>) =>
    Singletons.Docker.getAllContainers(Number(params.clientId)),
  getHostMetrics: ({ params }: RouteArgs<{ clientId: string }>) =>
    Singletons.Docker.getAllHostMetrics(Number(params.clientId)),
  /** Ping all clients or one via `params.clientId` */
  async getPing({ params }: RouteArgs<{ clientId?: string }>) {
    const clientId = params.clientId ? Number(params.clientId) : undefined
    const clients = clientId
      ? Singletons.Docker.getAllClients().filter((c) => c.id === clientId)
      : Singletons.Docker.getAllClients()
    const hosts = await Singletons.Docker.getAllHosts()
    const hostsMap = new Map(hosts.map((h) => [h.id, h]))

    const pingRes = await Promise.all(
      clients.map(async (c) => {
        const ping = await Singletons.Docker.ping(c.id)
        return {
          clientId: c.id,
          clientName: c.name,
          reachable: ping.reachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
          unreachable: ping.unreachableInstances.map((id) => hostsMap.get(id)).filter(Boolean),
        }
      })
    )
    return clientId ? pingRes[0] : pingRes
  },
  getPoolMetrics: () => Singletons.Docker.getPoolMetrics(),
  getStatus: () => Singletons.Docker.getStatus(),
}
