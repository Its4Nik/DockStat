import type { DockStatConfigTableType } from "@dockstat/typings/types"
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
})
  .post(
    "config",
    ({ body }) => {
      const res = updateConfig(body)
      configCache.invalidate()
      return res
    },
    {
      body: DatabaseModel.updateBody,
      detail: {
        description: "Updates the DockStat configuration. Changes are applied immediately.",
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
    () => configCache.getOrCompute("config", () => DockStatDB.configTable.select(["*"]).all()[0]),
    {
      detail: {
        description: "Retrieves the current DockStat configuration. Cached for 30 seconds.",
        summary: "Get Database Configuration",
      },
    }
  )
  .post(
    "config/pinItem",
    ({ body }) => {
      const { nav_links, id } = DockStatDB.configTable.select(["nav_links", "id"]).all()[0]
      const newPinnedNavLinks: DockStatConfigTableType["nav_links"] = [
        ...nav_links,
        { path: body.path, slug: body.slug },
      ]
      const res = DockStatDB.configTable.where({ id: id }).update({ nav_links: newPinnedNavLinks })
      configCache.invalidate()
      return res
    },
    {
      body: t.Object({
        path: t.String({ description: "URL path", examples: ["/dashboard/containers"] }),
        slug: t.String({ description: "Display name", examples: ["Containers"] }),
      }),
      detail: {
        description: "Adds a navigation item to the pinned links list.",
        summary: "Pin Navigation Item",
      },
    }
  )
  .post(
    "config/unpinItem",
    ({ body }) => {
      const { nav_links, id } = DockStatDB.configTable.select(["nav_links", "id"]).all()[0]
      const newPinnedNavLinks: DockStatConfigTableType["nav_links"] = nav_links.filter(
        (link) => link.path !== body.path || link.slug !== body.slug
      )
      const res = DockStatDB.configTable.where({ id: id }).update({ nav_links: newPinnedNavLinks })
      configCache.invalidate()
      return res
    },
    {
      body: t.Object({
        path: t.String({ description: "URL path", examples: ["/dashboard/containers"] }),
        slug: t.String({ description: "Display name", examples: ["Containers"] }),
      }),
      detail: {
        description: "Removes a navigation item from the pinned links list.",
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
        description: "Updates keyboard shortcuts configuration.",
        summary: "Update Hotkey Configuration",
      },
    }
  )
  .post(
    "/config/additionalSettings",
    ({ body }) => {
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
      return {
        data: body.additionalSettings,
        message: "Additional settings updated successfully",
        success: true,
      }
    },
    {
      body: DatabaseModel.additionalSettingsBody,
      detail: {
        description: "Updates additional application settings.",
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
    ({ body }) => {
      const currentConfig = DockStatDB.configTable.select(["additionalSettings", "id"]).all()[0]
      const newAdditionalSettings = {
        defaultDashboard: body.dashboardId ?? undefined,
        showBackendRamUsageInNavbar: currentConfig.additionalSettings?.showBackendRamUsageInNavbar,
      }
      DockStatDB.configTable.where({ id: 0 }).update({ additionalSettings: newAdditionalSettings })
      configCache.invalidate()
      return {
        data: newAdditionalSettings,
        message: "Default dashboard updated successfully",
        success: true,
      }
    },
    {
      body: t.Object({
        dashboardId: t.Nullable(
          t.String({
            description: "Dashboard ID or null to clear",
            examples: ["dashboard-containers", null],
          })
        ),
      }),
      detail: { description: "Sets the default dashboard.", summary: "Update Default Dashboard" },
      response: { 200: DatabaseModel.additionalSettingsRes, 400: DatabaseModel.error },
    }
  )

export default ConfigRoutes
