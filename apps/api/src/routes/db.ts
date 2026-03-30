import type { SQLQueryBindings } from "bun:sqlite"
import type { RepoFile } from "@dockstat/repo-cli/types"
import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { extractErrorMessage, repo } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import { DockStatDB } from "../database"
import { updateConfig } from "../database/utils"
import { DatabaseModel, RepositoryModel } from "../models/database"

const DBRoutes = new Elysia({
  name: "DatabaseElysiaInstance",
  prefix: "/db",
  detail: {
    tags: ["Database"],
    description:
      "Database configuration and management endpoints for managing DockStat system settings, repositories, themes, and application data",
  },
})
  .get(
    "/details",
    () => {
      const schema = DockStatDB._sqliteWrapper.getSchema()
      const integrity = DockStatDB._sqliteWrapper.integrityCheck()
      const backups = DockStatDB._sqliteWrapper.listBackups()
      const path = DockStatDB._dbPath

      const info: Record<
        string,
        {
          table: {
            name: string
            type: string
            sql: string
          }
          info: {
            cid: number
            name: string
            type: string
            notnull: number
            dflt_value: SQLQueryBindings
            pk: number
          }[]
        }
      > = {}

      for (const table of schema) {
        const i = DockStatDB._sqliteWrapper.getTableInfo(table.name)
        info[table.name] = { table, info: i }
      }

      return {
        info,
        integrity,
        path,
        backups,
      }
    },
    {
      detail: {
        summary: "Get Database Details",
        description:
          "Retrieves comprehensive information about the DockStat database including schema, table structures, integrity check results, and available backups. This endpoint is useful for database diagnostics and monitoring.",
        responses: {
          200: {
            description: "Successfully retrieved database details",
          },
        },
      },
    }
  )
  .get(
    "/details/:tableName/all",
    ({ params }) => DockStatDB._sqliteWrapper.table(params.tableName).select(["*"]).all(),
    {
      detail: {
        summary: "Get All Records from Table",
        description:
          "Retrieves all records from a specific database table. Use this endpoint to export data or perform bulk operations. Be careful with large tables as this may return many records.",
        responses: {
          200: {
            description: "Successfully retrieved all records from table",
          },
          404: {
            description: "Table not found",
          },
        },
      },
      params: t.Object({
        tableName: t.String({
          description: "The name of the database table to query",
          examples: ["docker_clients", "hosts", "plugins", "config", "repositories"],
        }),
      }),
    }
  )

  // ==================== Config Routes ====================
  .post(
    "config",
    ({ body, status }) => {
      try {
        const res = updateConfig(body)
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Database")
        return status(400, {
          success: false as const,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Update Database Configuration",
        description:
          "Updates the DockStat configuration stored in the database. This includes theme settings, hotkeys, navigation links, and other application preferences. Changes are applied immediately.",
        requestBody: {
          description: "Configuration updates to apply",
          required: true,
          content: {
            "application/json": {
              description: "Partial configuration object with fields to update",
            },
          },
        },
        responses: {
          200: {
            description: "Successfully updated configuration",
          },
          400: {
            description: "Failed to update configuration due to invalid input or error",
          },
        },
      },
      body: DatabaseModel.updateBody,
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
        const res = DockStatDB.configTable.select(["*"]).all()[0]
        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while opening Database")
        return status(400, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Get Database Configuration",
        description:
          "Retrieves the current DockStat configuration from the database. This includes all application settings such as theme, hotkeys, navigation links, and user preferences.",
        responses: {
          200: {
            description: "Successfully retrieved configuration",
          },
          400: {
            description: "Failed to retrieve configuration due to database error",
          },
        },
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

        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Nav links")
        return status(400, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Pin Navigation Item",
        description:
          "Adds a new navigation item to the pinned links list. Pinned items appear prominently in the navigation menu for quick access. Useful for frequently accessed pages or dashboards.",
        requestBody: {
          description: "Navigation item to pin",
          required: true,
          content: {
            "application/json": {
              schema: t.Object({
                path: t.String(),
                slug: t.String(),
              }),
              example: {
                path: "/dashboard/containers",
                slug: "Containers",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully pinned navigation item",
          },
          400: {
            description: "Failed to pin item due to invalid input or error",
          },
        },
      },
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

        return status(200, res)
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating Nav links")
        return status(400, {
          success: false as const,
          error: errorMessage,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Unpin Navigation Item",
        description:
          "Removes a navigation item from the pinned links list. The item will no longer appear in the prominent navigation menu section.",
        requestBody: {
          description: "Navigation item to unpin",
          required: true,
          content: {
            "application/json": {
              schema: t.Object({
                path: t.String(),
                slug: t.String(),
              }),
              example: {
                path: "/dashboard/containers",
                slug: "Containers",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully unpinned navigation item",
          },
          400: {
            description: "Failed to unpin item due to invalid input or error",
          },
        },
      },
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
    }
  )

  .post(
    "/config/hotkey",
    ({ body }) => DockStatDB.configTable.where({ id: 0 }).update({ hotkeys: body.hotkeys }),
    {
      detail: {
        summary: "Update Hotkey Configuration",
        description:
          "Updates the keyboard shortcuts configuration for the DockStat UI. Hotkeys are defined as arrays of key combinations for various actions throughout the application.",
        requestBody: {
          description: "Hotkey configuration with action-key mappings",
          required: true,
          content: {
            "application/json": {
              schema: DatabaseModel.hotkeyBody,
              example: {
                hotkeys: [
                  { action: "toggleSidebar", key: "Ctrl+B" },
                  { action: "refresh", key: "F5" },
                  { action: "search", key: "Ctrl+F" },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully updated hotkey configuration",
          },
          400: {
            description: "Failed to update hotkeys due to invalid input",
          },
        },
      },
      body: DatabaseModel.hotkeyBody,
    }
  )

  .post(
    "/config/additionalSettings",
    ({ body, status }) => {
      try {
        DockStatDB.configTable
          .where({ id: 0 })
          .update({ additionalSettings: body.additionalSettings })

        return status(200, {
          success: true,
          message: "Additional settings updated successfully",
          data: body.additionalSettings,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating additional settings")
        return status(400, {
          success: false,
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Update Additional Settings",
        description:
          "Updates additional application settings such as default dashboard, backend RAM display in navbar, and other optional configuration options. These settings control application behavior and UI preferences.",
        requestBody: {
          description: "Additional settings object with key-value pairs",
          required: true,
          content: {
            "application/json": {
              schema: DatabaseModel.additionalSettingsBody,
              example: {
                additionalSettings: {
                  showBackendRamUsageInNavbar: true,
                  defaultDashboard: "dashboard-containers",
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Successfully updated additional settings",
          },
          400: {
            description: "Failed to update additional settings due to invalid input",
          },
        },
      },
      body: DatabaseModel.additionalSettingsBody,
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
          showBackendRamUsageInNavbar:
            currentConfig.additionalSettings?.showBackendRamUsageInNavbar,
          defaultDashboard: body.dashboardId ?? undefined,
        }

        DockStatDB.configTable
          .where({ id: 0 })
          .update({ additionalSettings: newAdditionalSettings })

        return status(200, {
          success: true,
          message: "Default dashboard updated successfully",
          data: newAdditionalSettings,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error while updating default dashboard")
        return status(400, {
          success: false,
          error: String(error),
          message: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Update Default Dashboard",
        description:
          "Sets the default dashboard to display when users first open the application or navigate to the home page. The dashboardId should match a valid dashboard identifier in the system.",
        responses: {
          200: {
            description: "Successfully updated default dashboard",
          },
          400: {
            description: "Failed to update default dashboard due to invalid input",
          },
        },
      },
      body: t.Object({
        dashboardId: t.Nullable(
          t.String({
            description: "Identifier of the dashboard to set as default, or null to clear",
            examples: ["dashboard-containers", "dashboard-images", "dashboard-networks", null],
          })
        ),
      }),
      response: {
        200: DatabaseModel.additionalSettingsRes,
        400: DatabaseModel.error,
      },
    }
  )

  // ==================== Repository Routes ====================
  .get(
    "repositories",
    ({ status }) => {
      try {
        const repos = DockStatDB.repositoriesTable.select(["*"]).all()
        return status(200, {
          success: true,
          message: `Found ${repos.length} repositories`,
          data: repos,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error fetching repositories")
        return status(400, {
          success: false,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "List All Repositories",
        description:
          "Retrieves all registered plugin/theme repositories. Repositories are external sources from which plugins, themes, and stacks can be installed. This includes information about repository sources, policies, and available paths.",
        responses: {
          200: {
            description: "Successfully retrieved list of repositories",
          },
          400: {
            description: "Failed to fetch repositories due to database error",
          },
        },
      },
      response: {
        200: t.Any(),
        400: RepositoryModel.error,
      },
    }
  )
  .get(
    "repositories/:id",
    ({ params, status }) => {
      try {
        const repo = DockStatDB.repositoriesTable
          .select(["*"])
          .where({ id: Number(params.id) })
          .get()

        if (!repo) {
          return status(404, {
            success: false as const,
            message: `Repository with id ${params.id} not found`,
            error: `Repository with id ${params.id} not found`,
          })
        }

        return status(200, {
          success: true as const,
          message: "Repository found",
          data: repo,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error fetching repository")
        return status(400, {
          success: false as const,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Get Repository by ID",
        description:
          "Retrieves detailed information about a specific repository, including its configuration, paths to plugins/themes/stacks, and policy settings.",


        responses: {
          200: {
            description: "Successfully retrieved repository details",
          },
          404: {
            description: "Repository not found",
          },
          400: {
            description: "Failed to fetch repository due to error",
          },
        },
      },
      params: t.Object({
        id: t.String({
          description: "The unique identifier of the repository",
          examples: ["1", "2", "3"],
        }),
      }),
      response: {
        200: t.Any(),
        400: RepositoryModel.error,
        404: RepositoryModel.error,
      },
    }
  )
  .post(
    "repositories",
    async ({ body, status }) => {
      try {
        const repoFile = (await (await fetch(body.link_to_manifest)).json()) as RepoFile

        // Check if repository with same name already exists
        const existing = DockStatDB.repositoriesTable
          .select(["*"])
          .where({ name: repoFile.config.name })
          .get()

        if (existing) {
          return status(409, {
            success: false as const,
            message: `Repository with name "${repoFile.config.name}" already exists`,
            error: `Repository with name "${repoFile.config.name}" already exists`,
          })
        }

        // Insert the new repository
        DockStatDB.repositoriesTable.insert({
          name: repoFile.config.name,
          policy: repoFile.config.policy,
          source: repo.parseRawToDB(body.link_to_manifest).source,
          verification_api: repoFile.config.verification_api,
          type: repoFile.config.type,
          paths: {
            plugins: repoFile.config.plugins,
            stacks: repoFile.config.stacks,
            themes: repoFile.config.themes,
          },
        })

        // Fetch the newly created repository
        const newRepo = DockStatDB.repositoriesTable
          .select(["*"])
          .where({ name: repoFile.config.name })
          .get()

        if (!newRepo) {
          return status(400, {
            success: false as const,
            message: "Failed to retrieve created repository",
            error: "Failed to retrieve created repository",
          })
        }

        return status(201, {
          success: true as const,
          message: `Repository "${repoFile.config.name}" created successfully`,
          data: newRepo,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error creating repository")
        return status(400, {
          success: false as const,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Create Repository",
        description:
          "Adds a new plugin/theme repository to the system. The repository is fetched from a manifest URL, validated, and stored in the database. Once added, plugins, themes, and stacks from the repository can be installed.",
        requestBody: {
          description: "Repository manifest URL",
          required: true,
          content: {
            "application/json": {
              schema: RepositoryModel.createBody,
              example: {
                link_to_manifest: "https://example.com/repository/manifest.json",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Successfully created repository",
          },
          409: {
            description: "Repository with this name already exists",
          },
          400: {
            description: "Failed to create repository due to invalid manifest or error",
          },
        },
      },
      body: RepositoryModel.createBody,
      response: {
        201: RepositoryModel.successResponse,
        400: RepositoryModel.error,
        409: RepositoryModel.error,
      },
    }
  )
  .put(
    "repositories/:id",
    ({ params, body, status }) => {
      try {
        const repoId = Number(params.id)

        // Check if repository exists
        const existing = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()

        if (!existing) {
          return status(404, {
            success: false as const,
            message: `Repository with id ${repoId} not found`,
            error: `Repository with id ${repoId} not found`,
          })
        }

        // If name is being changed, check for conflicts
        if (body.name && body.name !== existing.name) {
          const nameConflict = DockStatDB.repositoriesTable
            .select(["*"])
            .where({ name: body.name })
            .get()

          if (nameConflict) {
            return status(409, {
              success: false as const,
              message: `Repository with name "${body.name}" already exists`,
              error: `Repository with name "${body.name}" already exists`,
            })
          }
        }

        // Update the repository (exclude id from update body)
        const { id: _id, ...updateData } = { ...body }
        DockStatDB.repositoriesTable.where({ id: repoId }).update(updateData)

        // Fetch the updated repository
        const updatedRepo = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()

        if (!updatedRepo) {
          return status(400, {
            success: false as const,
            message: "Failed to retrieve updated repository",
            error: "Failed to retrieve updated repository",
          })
        }

        return status(200, {
          success: true as const,
          message: `Repository "${updatedRepo.name}" updated successfully`,
          data: updatedRepo,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error updating repository")
        return status(400, {
          success: false as const,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Update Repository",
        description:
          "Updates configuration for an existing repository. You can modify the repository name, policy, verification API, type, or paths. Changing the name requires that no other repository uses that name.",
        responses: {
          200: {
            description: "Successfully updated repository",
          },
          404: {
            description: "Repository not found",
          },
          409: {
            description: "Repository name conflict",
          },
          400: {
            description: "Failed to update repository due to error",
          },
        },
      },
      params: t.Object({
        id: t.String({
          description: "The unique identifier of the repository to update",
          examples: ["1", "2", "3"],
        }),
      }),
      body: RepositoryModel.updateBody,
      response: {
        200: RepositoryModel.successResponse,
        400: RepositoryModel.error,
        404: RepositoryModel.error,
        409: RepositoryModel.error,
      },
    }
  )
  .delete(
    "repositories/:id",
    ({ params, status }) => {
      try {
        const repoId = Number(params.id)

        // Check if repository exists
        const existing = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()

        if (!existing) {
          return status(404, {
            success: false as const,
            message: `Repository with id ${repoId} not found`,
            error: `Repository with id ${repoId} not found`,
          })
        }

        // Delete the repository
        DockStatDB.repositoriesTable.where({ id: repoId }).delete()

        return status(200, {
          success: true as const,
          message: `Repository "${existing.name}" deleted successfully`,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error deleting repository")
        return status(400, {
          success: false as const,
          message: errorMessage,
          error: errorMessage,
        })
      }
    },
    {
      detail: {
        summary: "Delete Repository",
        description:
          "Permanently removes a repository from the system. This is a destructive operation that cannot be undone. Any plugins, themes, or stacks from this repository that have been installed will remain, but updates will no longer be available from this source.",
        responses: {
          200: {
            description: "Successfully deleted repository",
          },
          404: {
            description: "Repository not found",
          },
          400: {
            description: "Failed to delete repository due to error",
          },
        },
      },
      params: t.Object({
        id: t.String({
          description: "The unique identifier of the repository to delete",
          examples: ["1", "2", "3"],
        }),
      }),
      response: {
        200: RepositoryModel.deleteResponse,
        400: RepositoryModel.error,
        404: RepositoryModel.error,
      },
    }
  )

export default DBRoutes
