import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import { AuthHandler } from "../../auth"
import { configCache } from "../../cache"
import { DockStatDB } from "../../database"
import { updateConfig } from "../../database/utils"
import { DatabaseModel } from "../../models/database"

/**
 * Config CRUD routes - manages application configuration
 */
const ConfigRoutes = new Elysia({
  detail: {
    description: "Application configuration management endpoints",
    tags: ["Database"],
  },
  prefix: "/db",
})
  .post(
    "config",
    ({ body, status }) => {
      try {
        const res = updateConfig(body)
        configCache.invalidate() // Invalidate cache on update
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Database")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: DatabaseModel.updateBody,
      detail: {
        description:
          "Updates the DockStat configuration stored in the database. Changes are applied immediately.",
        requestBody: {
          content: {
            "application/json": {
              description: "Partial configuration object with fields to update",
            },
          },
          description: "Configuration updates to apply",
          required: true,
        },
        responses: {
          200: { description: "Successfully updated configuration" },
          400: { description: "Failed to update configuration" },
        },
        summary: "Update Database Configuration",
      },
      response: {
        200: DatabaseModel.updateRes,
        400: DatabaseModel.updateError,
      },
    }
  )
  .get(
    "config",
    ({ status }) => {
      try {
        // Use cache for config reads (30s TTL)
        return configCache.getOrCompute(
          "config",
          () => DockStatDB.configTable.select(["*"]).all()[0]
        )
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while opening Database")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      detail: {
        description:
          "Retrieves the current DockStat configuration from the database. Results are cached for 30 seconds.",
        responses: {
          200: { description: "Successfully retrieved configuration" },
          400: { description: "Failed to retrieve configuration" },
        },
        summary: "Get Database Configuration",
      },
    }
  )
  .post(
    "config/pinItem",
    ({ body, status }) => {
      try {
        const { nav_links, id } = DockStatDB.configTable.select(["nav_links", "id"]).all()[0]

        const newPinnedNavLinks: DockStatConfigTableType["nav_links"] = [
          ...nav_links,
          { path: body.path, slug: body.slug },
        ]

        const res = DockStatDB.configTable
          .where({ id: id })
          .update({ nav_links: newPinnedNavLinks })
        configCache.invalidate() // Invalidate cache on update
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Nav links")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: t.Object({
        path: t.String({
          description: "URL path of the navigation item",
          examples: ["/dashboard/containers", "/dashboard/images", "/settings"],
        }),
        slug: t.String({
          description: "Display name/slug for the navigation item",
          examples: ["Containers", "Images", "Settings"],
        }),
      }),
      detail: {
        description: "Adds a new navigation item to the pinned links list.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                path: "/dashboard/containers",
                slug: "Containers",
              },
              schema: t.Object({
                path: t.String(),
                slug: t.String(),
              }),
            },
          },
          description: "Navigation item to pin",
          required: true,
        },
        responses: {
          200: { description: "Successfully pinned navigation item" },
          400: { description: "Failed to pin item" },
        },
        summary: "Pin Navigation Item",
      },
    }
  )
  .post(
    "config/unpinItem",
    ({ body, status }) => {
      try {
        const { nav_links, id } = DockStatDB.configTable.select(["nav_links", "id"]).all()[0]

        const newPinnedNavLinks: DockStatConfigTableType["nav_links"] = nav_links.filter(
          (link) => link.path !== body.path || link.slug !== body.slug
        )

        const res = DockStatDB.configTable
          .where({ id: id })
          .update({ nav_links: newPinnedNavLinks })
        configCache.invalidate()
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Nav links")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: t.Object({
        path: t.String({
          description: "URL path of the navigation item to remove",
          examples: ["/dashboard/containers", "/dashboard/images"],
        }),
        slug: t.String({
          description: "Display name/slug of the navigation item to remove",
          examples: ["Containers", "Images"],
        }),
      }),
      detail: {
        description: "Removes a navigation item from the pinned links list.",
        requestBody: {
          content: {
            "application/json": {
              example: { path: "/dashboard/containers", slug: "Containers" },
              schema: t.Object({ path: t.String(), slug: t.String() }),
            },
          },
          description: "Navigation item to unpin",
          required: true,
        },
        responses: {
          200: { description: "Successfully unpinned navigation item" },
          400: { description: "Failed to unpin item" },
        },
        summary: "Unpin Navigation Item",
      },
    }
  )
  .post(
    "/config/hotkey",
    ({ body }) => {
      const res = DockStatDB.configTable.where({ id: 0 }).update({ hotkeys: body.hotkeys })
      configCache.invalidate()
      return res
    },
    {
      body: DatabaseModel.hotkeyBody,
      detail: {
        description: "Updates the keyboard shortcuts configuration for the DockStat UI.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                hotkeys: [
                  { action: "toggleSidebar", key: "Ctrl+B" },
                  { action: "refresh", key: "F5" },
                ],
              },
              schema: DatabaseModel.hotkeyBody,
            },
          },
          description: "Hotkey configuration with action-key mappings",
          required: true,
        },
        responses: {
          200: { description: "Successfully updated hotkey configuration" },
          400: { description: "Failed to update hotkeys" },
        },
        summary: "Update Hotkey Configuration",
      },
    }
  )
  .post(
    "/config/additionalSettings",
    ({ body, status }) => {
      try {
        const prev = DockStatDB.configTable
          .select(["additionalSettings"])
          .where({ id: 0 })
          .get()?.additionalSettings

        DockStatDB.configTable
          .where({ id: 0 })
          .update({ additionalSettings: body.additionalSettings })

        if (
          prev?.enableRegistration !== body.additionalSettings?.enableRegistration &&
          body.additionalSettings?.enableRegistration !== undefined
        ) {
          AuthHandler.setAllowGuestRegistration(body.additionalSettings.enableRegistration)
        }

        configCache.invalidate()
        return status(200, {
          data: body.additionalSettings,
          message: "Additional settings updated successfully",
          success: true,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating additional settings")
        return status(400, {
          message: errorMessage,
          success: false,
        })
      }
    },
    {
      body: DatabaseModel.additionalSettingsBody,
      detail: {
        description:
          "Updates additional application settings such as default dashboard, backend RAM display, etc.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                additionalSettings: {
                  defaultDashboard: "dashboard-containers",
                  showBackendRamUsageInNavbar: true,
                },
              },
              schema: DatabaseModel.additionalSettingsBody,
            },
          },
          description: "Additional settings object with key-value pairs",
          required: true,
        },
        responses: {
          200: { description: "Successfully updated additional settings" },
          400: { description: "Failed to update additional settings" },
        },
        summary: "Update Additional Settings",
      },
      response: {
        200: DatabaseModel.additionalSettingsRes,
        400: DatabaseModel.additionalSettingsRes,
      },
    }
  )
  .post(
    "/config/defaultDashboard",
    ({ body, status }) => {
      try {
        const currentConfig = DockStatDB.configTable.select(["additionalSettings", "id"]).all()[0]

        const newAdditionalSettings = {
          defaultDashboard: body.dashboardId ?? undefined,
          showBackendRamUsageInNavbar:
            currentConfig.additionalSettings?.showBackendRamUsageInNavbar,
        }

        DockStatDB.configTable
          .where({ id: 0 })
          .update({ additionalSettings: newAdditionalSettings })
        configCache.invalidate()

        return status(200, {
          data: newAdditionalSettings,
          message: "Default dashboard updated successfully",
          success: true,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating default dashboard")
        return status(400, {
          error: String(error),
          message: errorMessage,
          success: false,
        })
      }
    },
    {
      body: t.Object({
        dashboardId: t.Nullable(
          t.String({
            description: "Identifier of the dashboard to set as default, or null to clear",
            examples: ["dashboard-containers", "dashboard-images", null],
          })
        ),
      }),
      detail: {
        description: "Sets the default dashboard to display when users first open the application.",
        responses: {
          200: { description: "Successfully updated default dashboard" },
          400: { description: "Failed to update default dashboard" },
        },
        summary: "Update Default Dashboard",
      },
      response: {
        200: DatabaseModel.additionalSettingsRes,
        400: DatabaseModel.error,
      },
    }
  )

export default ConfigRoutes
