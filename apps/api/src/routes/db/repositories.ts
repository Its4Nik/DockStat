import type { RepoFile } from "@dockstat/repo-cli/types"
import { extractErrorMessage, repo } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import { repoCache } from "../../cache"
import { DockStatDB } from "../../database"
import { RepositoryModel } from "../../models/database"

/**
 * Repository CRUD routes (in /db prefix, distinct from /repositories)
 */
const DBRepositoryRoutes = new Elysia({
  detail: {
    description: "Repository management endpoints (under /db prefix)",
    tags: ["Database"],
  },
  prefix: "/db",
})
  .get(
    "repositories",
    ({ status }) => {
      try {
        const repos = DockStatDB.repositoriesTable.select(["*"]).all()
        return status(200, {
          data: repos,
          message: `Found ${repos.length} repositories`,
          success: true,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error fetching repositories")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false,
        })
      }
    },
    {
      detail: {
        description:
          "Retrieves all registered plugin/theme repositories. Repositories are external sources from which plugins, themes, and stacks can be installed.",
        responses: {
          200: { description: "Successfully retrieved list of repositories" },
          400: { description: "Failed to fetch repositories" },
        },
        summary: "List All Repositories",
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
        const found = DockStatDB.repositoriesTable
          .select(["*"])
          .where({ id: Number(params.id) })
          .get()

        if (!found) {
          return status(404, {
            error: `Repository with id ${params.id} not found`,
            message: `Repository with id ${params.id} not found`,
            success: false as const,
          })
        }

        return status(200, {
          data: found,
          message: "Repository found",
          success: true as const,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error fetching repository")
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
          "Retrieves detailed information about a specific repository, including its configuration, paths to plugins/themes/stacks, and policy settings.",
        responses: {
          200: { description: "Successfully retrieved repository details" },
          400: { description: "Failed to fetch repository" },
          404: { description: "Repository not found" },
        },
        summary: "Get Repository by ID",
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
            error: `Repository with name "${repoFile.config.name}" already exists`,
            message: `Repository with name "${repoFile.config.name}" already exists`,
            success: false as const,
          })
        }

        // Insert the new repository
        DockStatDB.repositoriesTable.insert({
          name: repoFile.config.name,
          paths: {
            plugins: repoFile.config.plugins,
            stacks: repoFile.config.stacks,
            themes: repoFile.config.themes,
          },
          policy: repoFile.config.policy,
          source: repo.parseRawToDB(body.link_to_manifest).source,
          type: repoFile.config.type,
          verification_api: repoFile.config.verification_api,
        })

        // Fetch the newly created repository
        const newRepo = DockStatDB.repositoriesTable
          .select(["*"])
          .where({ name: repoFile.config.name })
          .get()

        if (!newRepo) {
          return status(400, {
            error: "Failed to retrieve created repository",
            message: "Failed to retrieve created repository",
            success: false as const,
          })
        }

        // Invalidate repo cache when repos change
        repoCache.invalidate()
        return status(201, {
          data: newRepo,
          message: `Repository "${repoFile.config.name}" created successfully`,
          success: true as const,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error creating repository")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: RepositoryModel.createBody,
      detail: {
        description:
          "Adds a new plugin/theme repository to the system. The repository is fetched from a manifest URL, validated, and stored in the database.",
        requestBody: {
          content: {
            "application/json": {
              example: {
                link_to_manifest: "https://example.com/repository/manifest.json",
              },
              schema: RepositoryModel.createBody,
            },
          },
          description: "Repository manifest URL",
          required: true,
        },
        responses: {
          201: { description: "Successfully created repository" },
          400: { description: "Failed to create repository" },
          409: { description: "Repository with this name already exists" },
        },
        summary: "Create Repository",
      },
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

        const existing = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()

        if (!existing) {
          return status(404, {
            error: `Repository with id ${repoId} not found`,
            message: `Repository with id ${repoId} not found`,
            success: false as const,
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
              error: `Repository with name "${body.name}" already exists`,
              message: `Repository with name "${body.name}" already exists`,
              success: false as const,
            })
          }
        }

        // Update the repository (exclude id from update body)
        const { id: _id, ...updateData } = { ...body }
        DockStatDB.repositoriesTable.where({ id: repoId }).update(updateData)

        const updatedRepo = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()

        if (!updatedRepo) {
          return status(400, {
            error: "Failed to retrieve updated repository",
            message: "Failed to retrieve updated repository",
            success: false as const,
          })
        }

        repoCache.invalidate()
        return status(200, {
          data: updatedRepo,
          message: `Repository "${updatedRepo.name}" updated successfully`,
          success: true as const,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error updating repository")
        return status(400, {
          error: errorMessage,
          message: errorMessage,
          success: false as const,
        })
      }
    },
    {
      body: RepositoryModel.updateBody,
      detail: {
        description:
          "Updates configuration for an existing repository. You can modify the repository name, policy, verification API, type, or paths.",
        responses: {
          200: { description: "Successfully updated repository" },
          400: { description: "Failed to update repository" },
          404: { description: "Repository not found" },
          409: { description: "Repository name conflict" },
        },
        summary: "Update Repository",
      },
      params: t.Object({
        id: t.String({
          description: "The unique identifier of the repository to update",
          examples: ["1", "2", "3"],
        }),
      }),
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

        const existing = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()

        if (!existing) {
          return status(404, {
            error: `Repository with id ${repoId} not found`,
            message: `Repository with id ${repoId} not found`,
            success: false as const,
          })
        }

        DockStatDB.repositoriesTable.where({ id: repoId }).delete()
        repoCache.invalidate()

        return status(200, {
          message: `Repository "${existing.name}" deleted successfully`,
          success: true as const,
        })
      } catch (error) {
        const errorMessage = extractErrorMessage(error, "Error deleting repository")
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
          "Permanently removes a repository from the system. This is a destructive operation that cannot be undone.",
        responses: {
          200: { description: "Successfully deleted repository" },
          400: { description: "Failed to delete repository" },
          404: { description: "Repository not found" },
        },
        summary: "Delete Repository",
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

export default DBRepositoryRoutes
