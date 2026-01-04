import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { extractErrorMessage } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import { DockStatDB } from "../database"
import { updateConfig } from "../database/utils"
import { DatabaseModel, RepositoryModel } from "../models/database"

const DBRoutes = new Elysia({
  name: "DatabaseElysiaInstance",
  prefix: "/db",
  detail: {
    tags: ["DB"],
  },
})
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
      body: DatabaseModel.updateBody,
      response: {
        200: DatabaseModel.updateRes,
        400: DatabaseModel.updateError,
      },
    }
  )
  .get("config", ({ status }) => {
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
  })
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
      body: t.Object({
        path: t.String(),
        slug: t.String(),
      }),
    }
  )
  .post(
    "config/unpinItem",
    ({ body, status }) => {
      try {
        const { nav_links, id } = DockStatDB.configTable.select(["nav_links", "id"]).all()[0]

        const newPinnedNavLinks: DockStatConfigTableType["nav_links"] = nav_links.filter(
          (link) => link.path !== body.path && link.slug !== body.slug
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
      body: t.Object({
        path: t.String(),
        slug: t.String(),
      }),
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
      params: t.Object({
        id: t.String(),
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
    ({ body, status }) => {
      try {
        // Check if repository with same name already exists
        const existing = DockStatDB.repositoriesTable.select(["*"]).where({ name: body.name }).get()

        if (existing) {
          return status(409, {
            success: false as const,
            message: `Repository with name "${body.name}" already exists`,
            error: `Repository with name "${body.name}" already exists`,
          })
        }

        // Insert the new repository
        DockStatDB.repositoriesTable.insert(body)

        // Fetch the newly created repository
        const newRepo = DockStatDB.repositoriesTable.select(["*"]).where({ name: body.name }).get()

        if (!newRepo) {
          return status(400, {
            success: false as const,
            message: "Failed to retrieve created repository",
            error: "Failed to retrieve created repository",
          })
        }

        return status(201, {
          success: true as const,
          message: `Repository "${body.name}" created successfully`,
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
        const { id: _id, ...updateData } = body
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
      params: t.Object({
        id: t.String(),
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
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: RepositoryModel.deleteResponse,
        400: RepositoryModel.error,
        404: RepositoryModel.error,
      },
    }
  )

export default DBRoutes
