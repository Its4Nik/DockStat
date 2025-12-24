import BaseLogger from "../base-logger"
import { Html } from "@elysiajs/html"
import { Elysia, t } from "elysia"
import { db, pluginsTable, pluginVersionsTable, repositoriesTable, verificationsTable } from "../db"
import type { PluginVerificationView, RepositoryWithStats } from "../db/types"
import { fetchRepository } from "../services/repository"
import { RepositoryCard } from "../views/Repositories"
import { VerifiedCard } from "../views/Verify"

const _ = Html

const logger = BaseLogger.spawn("API-Routes")

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
  const totalPlugins = pluginsTable.all().length
  const totalVersions = pluginVersionsTable.all().length

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

  const totalRepositories = repositoriesTable.all().length

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
function getPluginsWithVerification(filter?: string): PluginVerificationView[] {
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
function getRepositoriesWithStats(): RepositoryWithStats[] {
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
async function syncRepository(repositoryId: number) {
  const repo = repositoriesTable.where({ id: repositoryId }).first()
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
    const existingVersion = pluginVersionsTable
      .where({ plugin_id: pluginId, version: fetchedPlugin.meta.version })
      .first()

    if (!existingVersion) {
      // Insert new version
      pluginVersionsTable.insert({
        plugin_id: pluginId,
        version: fetchedPlugin.meta.version,
        hash: fetchedPlugin.sourceHash,
        bundle_hash: fetchedPlugin.bundleHash,
        tags: fetchedPlugin.meta.tags,
      })
    }
  }

  // Update repository timestamp
  repositoriesTable
    .where({ id: repositoryId })
    .update({ updated_at: Math.floor(Date.now() / 1000) })

  logger.info(`Synced ${result.plugins.length} plugins from ${repo.name}`)

  return result
}

/**
 * API routes
 */
const apiRoutes = new Elysia({ prefix: "/api" })
  // Dashboard stats
  .get("/stats", () => {
    return getDashboardStats()
  })

  // Repositories
  .get("/repositories", () => {
    return getRepositoriesWithStats()
  })

  .post(
    "/repositories",
    async ({ body, set }) => {
      // Check if repository already exists
      const existing = repositoriesTable.where({ name: body.name }).first()
      if (existing) {
        set.status = 400
        return { error: "Repository with this name already exists" }
      }

      // Insert new repository
      const result = repositoriesTable.insert({
        name: body.name,
        url: body.url,
        enabled: (body.enabled || "on") === "on",
      })

      // Trigger initial sync
      try {
        await syncRepository(result.insertId)
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
    const repos = getRepositoriesWithStats()
    const repo = repos.find((r) => r.id === Number(params.id))

    if (!repo) {
      set.status = 404
      return { error: "Repository not found" }
    }

    return repo
  })

  .delete("/repositories/:id", ({ params, set }) => {
    const result = repositoriesTable.where({ id: Number(params.id) }).delete()

    if (result.changes === 0) {
      set.status = 404
      return { error: "Repository not found" }
    }

    // Return empty for HTMX to remove the element
    return ""
  })

  .post("/repositories/:id/sync", async ({ params, set }) => {
    try {
      await syncRepository(Number(params.id))

      // Return updated repository card
      const repos = getRepositoriesWithStats()
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
    const repo = repositoriesTable.where({ id: Number(params.id) }).first()

    if (!repo) {
      set.status = 404
      return { error: "Repository not found" }
    }

    repositoriesTable.where({ id: Number(params.id) }).update({ enabled: !repo.enabled })

    set.headers["HX-Refresh"] = "true"
    return { success: true }
  })

  // Plugins
  .get(
    "/plugins",
    ({ query }) => {
      const filter = query.filter as string | undefined
      return getPluginsWithVerification(filter)
    },
    {
      query: t.Object({
        filter: t.Optional(t.String()),
      }),
    }
  )

  .get("/plugins/:id", ({ params, set }) => {
    const plugins = getPluginsWithVerification()
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
      // Find the version
      const version = pluginVersionsTable
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
      const plugins = getPluginsWithVerification()
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
        security_status: t.Union([t.Literal("safe"), t.Literal("unsafe"), t.Literal("unknown")]),
      }),
    }
  )

  // Sync all repositories
  .post("/sync-all", async ({ set }) => {
    const repos = repositoriesTable.where({ enabled: true }).all()

    const results = await Promise.allSettled(repos.map((repo) => syncRepository(repo.id!)))

    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length

    set.headers["HX-Refresh"] = "true"
    return { succeeded, failed, total: repos.length }
  })

  // Manual plugin addition
  .post(
    "/plugins/manual",
    ({ body, set }) => {
      try {
        // Parse tags if provided as a string
        const tags = body.tags
          ? typeof body.tags === "string"
            ? body.tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t)
            : body.tags
          : undefined

        // Get or create a "Manual" repository
        let manualRepo = repositoriesTable.where({ name: "Manual Entries" }).first()
        if (!manualRepo) {
          const repoResult = repositoriesTable.insert({
            name: "Manual Entries",
            url: "manual://local",
            enabled: true,
          })
          // Verify repository was created successfully
          manualRepo = repositoriesTable.where({ id: repoResult.insertId }).first()
          if (!manualRepo) {
            throw new Error("Failed to create Manual Entries repository")
          }
        }

        // Check if plugin already exists
        const existingPlugin = pluginsTable
          .where({ repository_id: manualRepo.id, name: body.name })
          .first()

        let pluginId: number

        if (existingPlugin) {
          // Update existing plugin
          pluginsTable.where({ id: existingPlugin.id }).update({
            description: body.description,
            author_name: body.author_name,
            author_email: body.author_email,
            author_website: body.author_website,
            license: body.license || "MIT",
            repository_url: body.repository_url,
            repo_type: body.repo_type || "http",
            manifest_path: body.manifest_path || "manual",
            updated_at: Math.floor(Date.now() / 1000),
          })
          pluginId = existingPlugin.id!
        } else {
          // Insert new plugin
          const insertResult = pluginsTable.insert({
            repository_id: manualRepo.id!,
            name: body.name,
            description: body.description,
            author_name: body.author_name,
            author_email: body.author_email,
            author_website: body.author_website,
            license: body.license || "MIT",
            repository_url: body.repository_url,
            repo_type: body.repo_type || "http",
            manifest_path: body.manifest_path || "manual",
          })
          if (insertResult.insertId === undefined || insertResult.insertId === null) {
            throw new Error("Failed to insert plugin into database")
          }
          pluginId = insertResult.insertId
        }

        // Check if version already exists
        const existingVersion = pluginVersionsTable
          .where({ plugin_id: pluginId, version: body.version })
          .first()

        let versionId: number

        if (existingVersion) {
          // Update existing version
          pluginVersionsTable.where({ id: existingVersion.id }).update({
            hash: body.hash,
            bundle_hash: body.bundle_hash,
            tags: tags,
          })
          versionId = existingVersion.id!
        } else {
          // Insert new version
          const versionResult = pluginVersionsTable.insert({
            plugin_id: pluginId,
            version: body.version,
            hash: body.hash,
            bundle_hash: body.bundle_hash,
            tags: tags,
          })
          if (versionResult.insertId === undefined || versionResult.insertId === null) {
            throw new Error("Failed to insert plugin version into database")
          }
          versionId = versionResult.insertId
        }

        // Create initial verification record if security status provided
        if (body.security_status || body.verified_by) {
          const existingVerification = verificationsTable
            .where({ plugin_version_id: versionId })
            .first()

          if (!existingVerification) {
            verificationsTable.insert({
              plugin_version_id: versionId,
              verified: false,
              verified_by: body.verified_by || "manual",
              security_status: body.security_status || "unknown",
              notes: body.notes,
            })
          }
        }

        set.status = 201
        set.headers["HX-Trigger"] = "pluginAdded"
        return (
          <div class="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <title>Success</title>
              </svg>
              <div>
                <h4 class="text-sm font-semibold text-green-400 mb-1">Plugin Added Successfully</h4>
                <p class="text-sm text-gray-300 mb-2">
                  The plugin "<strong safe>{body.name}</strong>" version{" "}
                  <strong safe>{body.version}</strong> has been added to the verification database.
                </p>
                <a href="/plugins" class="text-blue-400 hover:text-blue-300 underline text-sm">
                  View in plugins list →
                </a>
              </div>
            </div>
          </div>
        )
      } catch (error) {
        logger.error(`Failed to add manual plugin: ${error}`)
        set.status = 500
        return (
          <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div class="flex items-start">
              <svg
                class="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <title>Error</title>
              </svg>
              <div>
                <h4 class="text-sm font-semibold text-red-400 mb-1">Failed to Add Plugin</h4>
                <p class="text-sm text-gray-300">
                  {error instanceof Error ? error.message : "An unexpected error occurred"}
                </p>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        version: t.String({ minLength: 1 }),
        hash: t.String({ minLength: 1 }),
        description: t.String({ minLength: 1 }),
        author_name: t.String({ minLength: 1 }),
        repository_url: t.String({ minLength: 1 }),
        author_email: t.Optional(t.String()),
        author_website: t.Optional(t.String()),
        license: t.Optional(t.String()),
        repo_type: t.Optional(
          t.Union([t.Literal("github"), t.Literal("gitlab"), t.Literal("http")])
        ),
        manifest_path: t.Optional(t.String()),
        bundle_hash: t.Optional(t.String()),
        tags: t.Optional(t.Union([t.String(), t.Array(t.String())])),
        security_status: t.Optional(
          t.Union([t.Literal("safe"), t.Literal("unsafe"), t.Literal("unknown")])
        ),
        verified_by: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
      detail: {
        summary: "Manually Add Plugin",
        description:
          "Manually add a plugin to the verification database without syncing from a repository. Creates or updates the plugin, version, and optionally initial verification status.",
        tags: ["Plugins"],
      },
    }
  )

export default apiRoutes
