import { DockStatError } from "@dockstat/errors"
import type { RepoFile } from "@dockstat/repo-cli/types"
import { repo } from "@dockstat/utils"
import Elysia, { t } from "elysia"
import { repoCache } from "../../cache"
import { DockStatDB } from "../../database"
import { RepositoryModel } from "../../models/database"

/**
 * Repository CRUD routes (in /db prefix)
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
    () => {
      const repos = DockStatDB.repositoriesTable.select(["*"]).all()
      return { data: repos, message: `Found ${repos.length} repositories`, success: true }
    },
    {
      detail: {
        description: "Retrieves all registered repositories.",
        summary: "List All Repositories",
      },
      response: { 200: t.Any(), 400: RepositoryModel.error },
    }
  )
  .get(
    "repositories/:id",
    ({ params }) => {
      const found = DockStatDB.repositoriesTable
        .select(["*"])
        .where({ id: Number(params.id) })
        .get()
      if (!found)
        throw new DockStatError("NOT_FOUND", {
          message: `Repository with id ${params.id} not found`,
        })
      return { data: found, message: "Repository found", success: true as const }
    },
    {
      detail: {
        description: "Retrieves a specific repository by ID.",
        summary: "Get Repository by ID",
      },
      params: t.Object({ id: t.String({ description: "Repository ID", examples: ["1", "2"] }) }),
      response: { 200: t.Any(), 404: RepositoryModel.error },
    }
  )
  .post(
    "repositories",
    async ({ body }) => {
      const repoFile = (await (await fetch(body.link_to_manifest)).json()) as RepoFile

      const existing = DockStatDB.repositoriesTable
        .select(["*"])
        .where({ name: repoFile.config.name })
        .get()
      if (existing)
        throw new DockStatError("CONFLICT", {
          message: `Repository "${repoFile.config.name}" already exists`,
        })

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

      const newRepo = DockStatDB.repositoriesTable
        .select(["*"])
        .where({ name: repoFile.config.name })
        .get()
      if (!newRepo)
        throw new DockStatError("INTERNAL_ERROR", {
          message: "Failed to retrieve created repository",
        })
      repoCache.invalidate()
      return {
        data: newRepo,
        message: `Repository "${repoFile.config.name}" created successfully`,
        success: true as const,
      }
    },
    {
      body: RepositoryModel.createBody,
      detail: {
        description: "Adds a new repository from a manifest URL.",
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
    ({ params, body }) => {
      const repoId = Number(params.id)
      const existing = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()
      if (!existing)
        throw new DockStatError("NOT_FOUND", { message: `Repository with id ${repoId} not found` })

      if (body.name && body.name !== existing.name) {
        const nameConflict = DockStatDB.repositoriesTable
          .select(["*"])
          .where({ name: body.name })
          .get()
        if (nameConflict)
          throw new DockStatError("CONFLICT", {
            message: `Repository "${body.name}" already exists`,
          })
      }

      const { id: _id, ...updateData } = { ...body }
      DockStatDB.repositoriesTable.where({ id: repoId }).update(updateData)

      const updatedRepo = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()
      if (!updatedRepo)
        throw new DockStatError("INTERNAL_ERROR", {
          message: "Failed to retrieve updated repository",
        })
      repoCache.invalidate()
      return {
        data: updatedRepo,
        message: `Repository "${updatedRepo.name}" updated successfully`,
        success: true as const,
      }
    },
    {
      body: RepositoryModel.updateBody,
      detail: { description: "Updates an existing repository.", summary: "Update Repository" },
      params: t.Object({ id: t.String({ description: "Repository ID", examples: ["1"] }) }),
      response: {
        200: RepositoryModel.successResponse,
        404: RepositoryModel.error,
        409: RepositoryModel.error,
      },
    }
  )
  .delete(
    "repositories/:id",
    ({ params }) => {
      const repoId = Number(params.id)
      const existing = DockStatDB.repositoriesTable.select(["*"]).where({ id: repoId }).get()
      if (!existing)
        throw new DockStatError("NOT_FOUND", { message: `Repository with id ${repoId} not found` })

      DockStatDB.repositoriesTable.where({ id: repoId }).delete()
      repoCache.invalidate()
      return {
        message: `Repository "${existing.name}" deleted successfully`,
        success: true as const,
      }
    },
    {
      detail: { description: "Permanently removes a repository.", summary: "Delete Repository" },
      params: t.Object({ id: t.String({ description: "Repository ID", examples: ["1"] }) }),
      response: { 200: RepositoryModel.deleteResponse, 404: RepositoryModel.error },
    }
  )

export default DBRepositoryRoutes
