import { Elysia, t } from "elysia"
import { DB } from "@dockstat/sqlite-wrapper"
import Logger from "@dockstat/logger"
import { Html } from "@elysiajs/html"
import {
  getRepositoryTable,
  getPluginsTable,
  getPluginVersionsTable,
  getVerificationsTable,
} from "../db"
import { fetchRepository } from "../services/repository"
import type { PluginVerificationView, RepositoryWithStats } from "../db/types"
import { VerifiedCard } from "../views/Verify"
import { RepositoryCard } from "../views/Repositories"

const logger = new Logger("API-Routes")

/**
 * Get dashboard statistics
 */
function getDashboardStats(db: DB) {
  const pluginsTable = getPluginsTable(db)
  const versionsTable = getPluginVersionsTable(db)
  const verificationsTable = getVerificationsTable(db)

  const totalPlugins = pluginsTable.all().length
  const totalVersions = versionsTable.all().length

  // Get verified versions count
  const verifiedVersions = verificationsTable.where({ verified: true }).all().length

  // Get safe plugins count
  const safePlugins = verificationsTable.where({ security_status: "safe" }).all().length

  const unsafePlugins = verificationsTable.where({ security_status: "unsafe" }).all().length

  // Verified plugins = plugins that have at least one verified version
  const verifiedPlugins = db
    .getDb()
    .query(
      `
    SELECT COUNT(DISTINCT p.id) as count
    FROM plugins p
    INNER JOIN plugin_versions pv ON p.id = pv.plugin_id
    INNER JOIN verifications v ON pv.id = v.plugin_version_id
    WHERE v.verified = 1
  `
    )
    .get() as { count: number }

  const pendingReview = totalVersions - verifiedVersions

  const totalRepositories = getRepositoryTable(db).all().length

  return {
    totalPlugins,
    verifiedPlugins: verifiedPlugins?.count || 0,
    totalVersions,
    verifiedVersions,
    safePlugins,
    unsafePlugins,
    pendingReview,
    totalRepositories,
  }
}

/**
 * Get all plugins with verification status
 */
function getPluginsWithVerification(db: DB, filter?: string): PluginVerificationView[] {
  let query = `
    SELECT
      p.id as plugin_id,
      p.name as plugin_name,
      p.description,
      p.author_name,
      p.author_email,
      p.author_website,
      p.license,
      p.repository_url,
      p.repo_type,
      pv.version,
      pv.hash as version_hash,
      pv.bundle_hash,
      pv.tags,
      COALESCE(v.verified, 0) as verified,
      v.verified_by,
      v.verified_at,
      COALESCE(v.security_status, 'unknown') as security_status,
      v.notes
    FROM plugins p
    INNER JOIN plugin_versions pv ON p.id = pv.plugin_id
    LEFT JOIN verifications v ON pv.id = v.plugin_version_id
  `

  if (filter === "verified") {
    query += " WHERE v.verified = 1"
  } else if (filter === "unverified") {
    query += " WHERE v.verified IS NULL OR v.verified = 0"
  } else if (filter === "safe") {
    query += " WHERE v.security_status = 'safe'"
  } else if (filter === "unsafe") {
    query += " WHERE v.security_status = 'unsafe'"
  }

  query += " ORDER BY p.name ASC, pv.created_at DESC"

  const results = db.getDb().query(query).all() as PluginVerificationView[]

  // Parse JSON tags
  return results.map((r) => ({
    ...r,
    tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags,
    verified: Boolean(r.verified),
  }))
}

/**
 * Get repositories with stats
 */
function getRepositoriesWithStats(db: DB): RepositoryWithStats[] {
  const query = `
    SELECT
      r.*,
      COUNT(DISTINCT p.id) as total_plugins,
      COUNT(DISTINCT CASE WHEN v.verified = 1 THEN p.id END) as verified_plugins,
      COUNT(DISTINCT pv.id) as total_versions,
      COUNT(DISTINCT CASE WHEN v.verified = 1 THEN pv.id END) as verified_versions
    FROM repositories r
    LEFT JOIN plugins p ON r.id = p.repository_id
    LEFT JOIN plugin_versions pv ON p.id = pv.plugin_id
    LEFT JOIN verifications v ON pv.id = v.plugin_version_id
    GROUP BY r.id
    ORDER BY r.name ASC
  `

  return db.getDb().query(query).all() as RepositoryWithStats[]
}

/**
 * Sync a repository - fetch plugins and update database
 */
async function syncRepository(db: DB, repositoryId: number) {
  const repoTable = getRepositoryTable(db)
  const pluginsTable = getPluginsTable(db)
  const versionsTable = getPluginVersionsTable(db)

  const repo = repoTable.where({ id: repositoryId }).first()
  if (!repo) {
    throw new Error("Repository not found")
  }

  logger.info(`Syncing repository: ${repo.name} (${repo.url})`)

  const result = await fetchRepository(repo.url)

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch repository")
  }

  for (const fetchedPlugin of result.plugins) {
    // Check if plugin exists
    const existingPlugin = pluginsTable
      .where({ repository_id: repositoryId, name: fetchedPlugin.meta.name })
      .first()

    let pluginId: number

    if (existingPlugin) {
      // Update existing plugin
      pluginsTable.where({ id: existingPlugin.id }).update({
        description: fetchedPlugin.meta.description,
        author_name: fetchedPlugin.meta.author.name,
        author_email: fetchedPlugin.meta.author.email,
        author_website: fetchedPlugin.meta.author.website,
        license: fetchedPlugin.meta.author.license,
        repository_url: fetchedPlugin.meta.repository,
        repo_type: fetchedPlugin.meta.repoType as "github" | "gitlab" | "http",
        manifest_path: fetchedPlugin.meta.manifest,
        updated_at: Math.floor(Date.now() / 1000),
      })
      pluginId = existingPlugin.id!
    } else {
      // Insert new plugin
      const insertResult = pluginsTable.insert({
        repository_id: repositoryId,
        name: fetchedPlugin.meta.name,
        description: fetchedPlugin.meta.description,
        author_name: fetchedPlugin.meta.author.name,
        author_email: fetchedPlugin.meta.author.email,
        author_website: fetchedPlugin.meta.author.website,
        license: fetchedPlugin.meta.author.license,
        repository_url: fetchedPlugin.meta.repository,
        repo_type: fetchedPlugin.meta.repoType as "github" | "gitlab" | "http",
        manifest_path: fetchedPlugin.meta.manifest,
      })
      pluginId = insertResult.insertId
    }

    // Check if version exists
    const existingVersion = versionsTable
      .where({ plugin_id: pluginId, version: fetchedPlugin.meta.version })
      .first()

    if (!existingVersion) {
      // Insert new version
      versionsTable.insert({
        plugin_id: pluginId,
        version: fetchedPlugin.meta.version,
        hash: fetchedPlugin.sourceHash,
        bundle_hash: fetchedPlugin.bundleHash,
        tags: fetchedPlugin.meta.tags,
      })
    }
  }

  // Update repository timestamp
  repoTable.where({ id: repositoryId }).update({ updated_at: Math.floor(Date.now() / 1000) })

  logger.info(`Synced ${result.plugins.length} plugins from ${repo.name}`)

  return result
}

/**
 * Create API routes
 */
export function createApiRoutes(db: DB) {
  return (
    new Elysia({ prefix: "/api" })
      // Dashboard stats
      .get("/stats", () => {
        return getDashboardStats(db)
      })

      // Repositories
      .get("/repositories", () => {
        return getRepositoriesWithStats(db)
      })

      .post(
        "/repositories",
        async ({ body, set }) => {
          const repoTable = getRepositoryTable(db)

          // Check if repository already exists
          const existing = repoTable.where({ name: body.name }).first()
          if (existing) {
            set.status = 400
            return { error: "Repository with this name already exists" }
          }

          // Insert new repository
          const result = repoTable.insert({
            name: body.name,
            url: body.url,
            enabled: (body.enabled || "on") === "on",
          })

          // Trigger initial sync
          try {
            await syncRepository(db, result.insertId)
          } catch (_) {
            logger.warn(`Initial sync failed for repository ${body.name}`)
          }

          // Redirect to repositories page
          set.headers["HX-Redirect"] = "/repositories"
          return { success: true, id: result.insertId }
        },
        {
          body: t.Object({
            name: t.String(),
            url: t.String(),
            enabled: t.Optional(t.String()),
          }),
        }
      )

      .get("/repositories/:id", ({ params, set }) => {
        const repos = getRepositoriesWithStats(db)
        const repo = repos.find((r) => r.id === Number(params.id))

        if (!repo) {
          set.status = 404
          return { error: "Repository not found" }
        }

        return repo
      })

      .delete("/repositories/:id", ({ params, set }) => {
        const repoTable = getRepositoryTable(db)
        const result = repoTable.where({ id: Number(params.id) }).delete()

        if (result.changes === 0) {
          set.status = 404
          return { error: "Repository not found" }
        }

        // Return empty for HTMX to remove the element
        return ""
      })

      .post("/repositories/:id/sync", async ({ params, set }) => {
        try {
          await syncRepository(db, Number(params.id))

          // Return updated repository card
          const repos = getRepositoriesWithStats(db)
          const repo = repos.find((r) => r.id === Number(params.id))

          if (repo) {
            return <RepositoryCard repository={repo} />
          }

          set.headers["HX-Refresh"] = "true"
          return { success: true }
        } catch (error) {
          set.status = 500
          return { error: error instanceof Error ? error.message : "Sync failed" }
        }
      })

      .patch("/repositories/:id/toggle", ({ params, set }) => {
        const repoTable = getRepositoryTable(db)
        const repo = repoTable.where({ id: Number(params.id) }).first()

        if (!repo) {
          set.status = 404
          return { error: "Repository not found" }
        }

        repoTable.where({ id: Number(params.id) }).update({ enabled: !repo.enabled })

        set.headers["HX-Refresh"] = "true"
        return { success: true }
      })

      // Plugins
      .get(
        "/plugins",
        ({ query }) => {
          const filter = query.filter as string | undefined
          return getPluginsWithVerification(db, filter)
        },
        {
          query: t.Object({
            filter: t.Optional(t.String()),
          }),
        }
      )

      .get("/plugins/:id", ({ params, set }) => {
        const plugins = getPluginsWithVerification(db)
        const plugin = plugins.find((p) => p.plugin_id === Number(params.id))

        if (!plugin) {
          set.status = 404
          return { error: "Plugin not found" }
        }

        return plugin
      })

      // Verification
      .post(
        "/plugins/:id/versions/:version/verify",
        ({ params, body, set }) => {
          const versionsTable = getPluginVersionsTable(db)
          const verificationsTable = getVerificationsTable(db)

          // Find the version
          const version = versionsTable
            .where({ plugin_id: Number(params.id), version: params.version })
            .first()

          if (!version) {
            set.status = 404
            return { error: "Plugin version not found" }
          }

          // Check if already verified
          const existingVerification = verificationsTable
            .where({ plugin_version_id: version.id })
            .first()

          if (existingVerification) {
            // Update existing verification
            verificationsTable.where({ id: existingVerification.id }).update({
              verified: true,
              verified_by: body.verified_by,
              verified_at: Math.floor(Date.now() / 1000),
              notes: body.notes,
              security_status: body.security_status,
            })
          } else {
            // Create new verification
            verificationsTable.insert({
              plugin_version_id: version.id!,
              verified: true,
              verified_by: body.verified_by,
              verified_at: Math.floor(Date.now() / 1000),
              notes: body.notes,
              security_status: body.security_status,
            })
          }

          // Get updated plugin data
          const plugins = getPluginsWithVerification(db)
          const plugin = plugins.find(
            (p) => p.plugin_id === Number(params.id) && p.version === params.version
          )

          if (plugin) {
            // Return verified card for HTMX swap
            return <VerifiedCard plugin={plugin} />
          }

          return { success: true }
        },
        {
          body: t.Object({
            verified_by: t.String(),
            notes: t.Optional(t.String()),
            security_status: t.Union([
              t.Literal("safe"),
              t.Literal("unsafe"),
              t.Literal("unknown"),
            ]),
          }),
        }
      )

      // Sync all repositories
      .post("/sync-all", async ({ set }) => {
        const repoTable = getRepositoryTable(db)
        const repos = repoTable.where({ enabled: true }).all()

        const results = await Promise.allSettled(repos.map((repo) => syncRepository(db, repo.id!)))

        const succeeded = results.filter((r) => r.status === "fulfilled").length
        const failed = results.filter((r) => r.status === "rejected").length

        set.headers["HX-Refresh"] = "true"
        return { succeeded, failed, total: repos.length }
      })
  )
}
