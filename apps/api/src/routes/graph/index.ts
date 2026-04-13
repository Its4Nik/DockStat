import type { DOCKER } from "@dockstat/typings"
import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DNH } from "../../docker/docknode"
import { calculateNodeLayout, type DockNodeArray } from "../../graph"
import { mapReachableStatus } from "../../graph/reachableStatus"
import { GraphModel } from "../../models/graph"

export const GraphElysia = new Elysia({
  detail: {
    tags: ["Infrastructure Graph"],
  },
  prefix: "/graph",
})
  .get(
    "/",
    async ({ status }) => {
      try {
        const clients = DCM.getAllClients()
        const hosts = await DCM.getAllHosts()

        // Fetch containers per client
        const containersNested = await Promise.all(clients.map((c) => DCM.getAllContainers(c.id)))

        // Flatten containers into a single array for the layout function
        const containers: DOCKER.ContainerInfo[] = containersNested.flat()

        const rawDockNodes = await DNH.getAllNodes()

        // Transform dockNodes to match the strict Schema
        const dockNodes: DockNodeArray = rawDockNodes
          .map((node) => {
            if (node.id === undefined) return null

            return {
              hostname: node.host,
              id: node.id,
              name: node.name,
              port: node.port,
              reachable: mapReachableStatus(node),
            }
          })
          .filter((node): node is NonNullable<typeof node> => node !== null)

        // Pass the flattened containers array to the layout function
        const { nodes, edges } = calculateNodeLayout({
          clients,
          containers,
          dockNodes,
          hosts,
        })

        const dat = {
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

        return status(200, dat)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Could not fetch graph data")
        return status(400, {
          error: errorMessage,
          success: false as const,
        })
      }
    },
    {
      response: {
        200: GraphModel.GraphDataSchema,
        400: t.Object({ error: t.String(), success: t.Boolean() }),
      },
    }
  )
  .get("/regions", async () => {
    return {
      regions: [],
    }
  })
  .post(
    "/regions",
    async () => {
      return {
        message: "Region creation not yet implemented",
        success: true as const,
      }
    },
    {
      body: t.Object({
        color: t.Optional(t.String()),
        description: t.Optional(t.String()),
        name: t.String(),
      }),
    }
  )

export default GraphElysia
