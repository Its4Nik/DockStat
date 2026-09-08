import type { DOCKER } from "@dockstat/typings"
import Singletons from "../singletons"
import { calculateNodeLayout, type DockNodeArray } from "../graph"
import { mapReachableStatus } from "../graph/reachableStatus"

export const GraphLoaders = {
  async getGraphData() {
    const DCM = Singletons.Docker
    const clients = DCM.getAllClients()
    const hosts = await DCM.getAllHosts()

    const containersNested = await Promise.all(clients.map((c) => DCM.getAllContainers(c.id)))
    const containers: DOCKER.ContainerInfo[] = containersNested.flat()

    const rawDockNodes = await Singletons.DockNodes.getAllNodes()

    const dockNodes: DockNodeArray = rawDockNodes
      .map((node) => {
        if (node.id === undefined) return null
        return {
          hostname: node.host ?? undefined,
          id: node.id,
          name: node.name ?? undefined,
          port: node.port ?? undefined,
          reachable: mapReachableStatus(node),
        }
      })
      .filter((node): node is NonNullable<typeof node> => node !== null)

    const { nodes, edges } = calculateNodeLayout({ clients, containers, dockNodes, hosts })

    return {
      clients: clients.map((c) => ({
        id: c.id,
        initialized: c.initialized ?? false,
        name: c.name,
      })),
      containers,
      dockNodes,
      edges,
      hosts: hosts.map((h) => ({
        clientId: h.clientId,
        id: h.id,
        name: h.name,
        reachable: h.reachable ?? false,
      })),
      nodes,
    }
  },
}
