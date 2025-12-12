import type { PluginActions } from "@dockstat/typings"
import type { DockNodePluginTable } from "./types"

/**
 * Note:
 * PluginActionContext uses the shape { table, body, logger, previousAction }.
 * The plugin previously expected `instanceId` and `params` at top-level of the ctx object.
 * Adjust handlers to read those values from `body` and keep local type narrowing.
 */
export const actions: PluginActions<DockNodePluginTable> = {
  pre: ({ table, body }) => {
    if (!table) {
      throw new Error("Table not initialized")
    }

    const instanceId = (body as { instanceId?: string } | undefined)?.instanceId
    if (!instanceId) {
      throw new Error("No instance id found")
    }
  },

  registerNode: ({ table, body }) => {
    if (!body) {
      throw new Error("Request body is required to register a node")
    }

    const pParams = body as Omit<DockNodePluginTable, "id">

    if (!pParams.authenticationKey) {
      throw new Error("Authentication key needed for connection to DockNode clients needed.")
    }
    if ((pParams.name ?? "").length < 1) {
      throw new Error("Name needed to register a node")
    }
    if (!pParams.host || !pParams.host.adress || !pParams.host.port || !pParams.host.proto) {
      throw new Error("A full Host object is needed for registering")
    }

    table?.insertOrReplace({
      authenticationKey: pParams.authenticationKey,
      certData: pParams.certData ?? null,
      handlers: pParams.handlers,
      host: pParams.host,
      name: pParams.name,
    })
  },

  getNodes: ({ table, logger }) => {
    logger.info("Getting Node count")
    return table?.select(["*"]).count()
  },
} as const
