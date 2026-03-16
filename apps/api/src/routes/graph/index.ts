import type { DOCKER } from "@dockstat/typings"
import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"
import { DNH } from "../../docker/docknode"
import { calculateNodeLayout, type DockNodeArray } from "../../graph"
import { mapReachableStatus } from "../../graph/reachableStatus"
import { GraphModel } from "../../models/graph"

export const GraphElysia = new Elysia({
  prefix: "/graph",
  detail: {
    tags: ["Infrastructure Graph"],
  },
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
              id: node.id,
              name: node.name,
              hostname: node.host,
              port: node.port,
              reachable: mapReachableStatus(node),
            }
          })
          .filter((node): node is NonNullable<typeof node> => node !== null)

        // Pass the flattened containers array to the layout function
        const { nodes, edges } = calculateNodeLayout({
          clients,
          hosts,
          dockNodes,
          containers,
        })

        const dat = {
          nodes,
          edges,
          clients: clients.map((c) => ({
            id: c.id,
            name: c.name,
            initialized: c.initialized ?? false,
          })),
          hosts: hosts.map((h) => ({
            id: h.id,
            name: h.name,
            clientId: h.clientId,
            reachable: h.reachable ?? false,
          })),
          dockNodes,
          containers,
        }

        return status(200, dat)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Could not fetch graph data")
        return status(400, {
          success: false as const,
          error: errorMessage,
        })
      }
    },
    {
      response: {
        200: GraphModel.GraphDataSchema,
        400: t.Object({ success: t.Boolean(), error: t.String() }),
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
    async ({ body }) => {
      return {
        success: true as const,
        message: "Region creation not yet implemented",
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        color: t.Optional(t.String()),
      }),
    }
  )

export default GraphElysia
