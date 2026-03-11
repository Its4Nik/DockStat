import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import DCM from "../../docker"

// Types for graph visualization
const GraphNodeType = t.Union([
    t.Literal("docknode"),
    t.Literal("host"),
    t.Literal("container"),
    t.Literal("client"),
])

const GraphNodeSchema = t.Object({
    id: t.String(),
    type: GraphNodeType,
    position: t.Object({
        x: t.Number(),
        y: t.Number(),
    }),
    data: t.Object({
        label: t.String(),
        status: t.String(),
        ipAddress: t.Optional(t.String()),
        port: t.Optional(t.Number()),
        image: t.Optional(t.String()),
        clientId: t.Optional(t.Number()),
        hostId: t.Optional(t.Number()),
    }),
})

const GraphEdgeSchema = t.Object({
    id: t.String(),
    source: t.String(),
    target: t.String(),
    animated: t.Optional(t.Boolean()),
    style: t.Optional(t.Object({
        stroke: t.Optional(t.String()),
    })),
})

const GraphDataSchema = t.Object({
    nodes: t.Array(GraphNodeSchema),
    edges: t.Array(GraphEdgeSchema),
    clients: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        reachable: t.Boolean(),
    })),
    hosts: t.Array(t.Object({
        id: t.Number(),
        name: t.String(),
        clientId: t.Number(),
        reachable: t.Boolean(),
    })),
})

// Layout helper - arrange nodes in a grid
function calculateNodeLayout(clients: any[], hosts: any[]) {
    const nodes: any[] = []
    const edges: any[] = []

    const nodeSpacingX = 300
    const nodeSpacingY = 200
    const startX = 50
    const startY = 50

    // Create client nodes
    clients.forEach((client, clientIndex) => {
        const clientX = startX
        const clientY = startY + clientIndex * nodeSpacingY

        nodes.push({
            id: `client-${client.id}`,
            type: "client",
            position: { x: clientX, y: clientY },
            data: {
                label: client.name || `Client ${client.id}`,
                status: client.reachable ? "online" : "offline",
                ipAddress: client.host,
                port: client.port,
                clientId: client.id,
            },
        })

        // Create host nodes for this client
        const clientHosts = hosts.filter(h => h.clientId === client.id)
        clientHosts.forEach((host, hostIndex) => {
            const hostX = clientX + nodeSpacingX
            const hostY = startY + clientIndex * nodeSpacingY + hostIndex * 120

            nodes.push({
                id: `host-${host.id}`,
                type: "host",
                position: { x: hostX, y: hostY },
                data: {
                    label: host.name || `Host ${host.id}`,
                    status: host.reachable ? "online" : "offline",
                    ipAddress: host.host,
                    port: host.port,
                    clientId: client.id,
                    hostId: host.id,
                },
            })

            // Create edge from client to host
            edges.push({
                id: `edge-client-${client.id}-host-${host.id}`,
                source: `client-${client.id}`,
                target: `host-${host.id}`,
                animated: host.reachable,
                style: { stroke: host.reachable ? "#10b981" : "#ef4444" },
            })
        })
    })

    return { nodes, edges }
}

export const GraphElysia = new Elysia({
    prefix: "/graph",
    detail: {
        tags: ["Infrastructure Graph"],
    },
})
    .get("/", async () => {
        try {
            const clients = DCM.getAllClients()
            const hosts = await DCM.getAllHosts()

            const { nodes, edges } = calculateNodeLayout(clients, hosts)

            return {
                nodes,
                edges,
                clients: clients.map(c => ({
                    id: c.id,
                    name: c.name,
                    reachable: c.initialized ?? false,
                })),
                hosts: hosts.map(h => ({
                    id: h.id,
                    name: h.name,
                    clientId: h.clientId,
                    reachable: h.reachable ?? false,
                })),
            }
        } catch (error) {
            const errorMessage = extractErrorMessage(error, "Could not fetch graph data")
            return {
                success: false as const,
                error: errorMessage,
            }
        }
    }, {
        response: GraphDataSchema,
    })
    .get("/regions", async () => {
        // Placeholder for regions - would need database table
        return {
            regions: [],
        }
    })
    .post("/regions", async ({ body }) => {
        // Placeholder for creating regions
        return {
            success: true as const,
            message: "Region creation not yet implemented",
        }
    }, {
        body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
            color: t.Optional(t.String()),
        }),
    })

export default GraphElysia