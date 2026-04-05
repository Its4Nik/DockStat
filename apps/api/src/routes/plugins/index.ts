import Elysia, { t } from "elysia"
import { PluginModel } from "../../models/plugins"
import PluginHandler from "../../plugins"
import DockStatAPIFrontendPluginRoutes from "./frontend"

const PluginRoutes = new Elysia({
  detail: {
    description:
      "Plugin management endpoints for installing, activating, deactivating, and managing DockStat plugins. Plugins extend system functionality with custom routes, database tables, and event hooks.",
    tags: ["Plugins"],
  },
  prefix: "/plugins",
})
  .use(DockStatAPIFrontendPluginRoutes)
  .get("/all", () => PluginHandler.getAll(), {
    detail: {
      description:
        "Retrieves all installed plugins with their activation status, version information, and metadata. This includes both active and inactive plugins, providing a complete view of the plugin system state.",
      responses: {
        200: {
          description: "Successfully retrieved all plugins",
        },
      },
      summary: "List All Plugins",
    },
  })
  .get(
    "/hooks",
    () => {
      const handlers = PluginHandler.getHookHandlers()
      const hooksArray: { pluginId: number; hooks: string[] }[] = []

      for (const [pluginId, hooks] of handlers.entries()) {
        const hookList = Object.keys(hooks)
        hooksArray.push({
          hooks: hookList,
          pluginId: Number(pluginId),
        })
      }

      return hooksArray
    },
    {
      detail: {
        description:
          "Retrieves all registered event hooks from active plugins. Hooks allow plugins to react to system events such as container lifecycle changes, plugin activation, and request processing. This endpoint shows which plugins are listening to which events.",
        responses: {
          200: {
            description: "Successfully retrieved plugin hooks",
          },
        },
        summary: "Get Plugin Hooks",
      },
    }
  )
  .get("/status", () => PluginHandler.getStatus(), {
    detail: {
      description:
        "Retrieves overall status of the plugin system including total plugins, active plugins, total routes, and total hooks. Useful for monitoring plugin system health and usage statistics.",
      responses: {
        200: {
          description: "Successfully retrieved plugin system status",
        },
      },
      summary: "Get Plugin System Status",
    },
  })
  .post("/install", ({ body }) => PluginHandler.savePlugin(body), {
    body: PluginModel.installPluginBody,
    description:
      "Installs a new plugin into the DockStat system. The plugin code is stored in the database and can be activated later. Plugins can provide custom API routes, database tables, event hooks, and background tasks.",
    responses: {
      200: {
        description: "Successfully installed plugin",
      },
      400: {
        description: "Failed to install plugin due to invalid input or plugin code errors",
      },
    },
    summary: "Install Plugin",
  })
  .post(
    "/loadPlugins",
    async ({ body, status }) => status(200, await PluginHandler.loadPlugins(body)),
    {
      body: PluginModel.activatePluginBody,
      detail: {
        description:
          "Activates one or more installed plugins by loading them into memory and registering their routes, hooks, and database tables. Only active plugins can contribute functionality to the system. This endpoint returns detailed success/failure information for each plugin.",
        responses: {
          200: {
            description:
              "Attempted to load specified plugins. Check response for individual success/failure status.",
          },
          400: {
            description: "Failed to load plugins due to invalid request or errors",
          },
        },
        summary: "Load/Activate Plugins",
      },
      responses: { 200: PluginModel.activatePluginRes },
    }
  )
  .post(
    "/unloadPlugins",
    async ({ status, body }) => status(200, await PluginHandler.unloadPlugins(body.ids)),
    { body: t.Object({ ids: t.Array(t.Number()) }) }
  )
  .post("/delete", ({ body }) => PluginHandler.deletePlugin(body.pluginId), {
    body: PluginModel.deletePluginBody,
    detail: {
      description:
        "Permanently removes a plugin from the system. This is a destructive operation that cannot be undone. The plugin code is deleted from the database and all associated resources are cleaned up. The plugin must be inactive before it can be deleted.",
      responses: {
        200: {
          description: "Successfully deleted plugin",
        },
        400: {
          description: "Failed to delete plugin because it's still active or not found",
        },
      },
      summary: "Delete Plugin",
    },
  })
  .get("/routes", () => PluginHandler.getAllPluginRoutes(), {
    detail: {
      description:
        "Retrieves all custom API routes registered by active plugins. This includes route paths, HTTP methods, handler functions, and associated plugin IDs. Useful for discovering plugin-provided API endpoints and debugging route conflicts.",
      responses: {
        200: {
          description: "Successfully retrieved all plugin routes",
        },
      },
      summary: "Get All Plugin Routes",
    },
  })

export default PluginRoutes
