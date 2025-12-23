import { Elysia } from "elysia"
import { Html } from "@elysiajs/html"
import type { DB } from "@dockstat/sqlite-wrapper"
import {
  getRepositoryTable,
  getPluginsTable,
  getPluginVersionsTable,
  getVerificationsTable,
} from "../db"
import type { PluginVerificationView, RepositoryWithStats } from "../db/types"
import { Dashboard, type DashboardStats } from "../views/Dashboard"
import { PluginsView, PluginsContent, PluginDetail } from "../views/Plugins"
import { RepositoriesView, RepositoryDetail, AddRepositoryView } from "../views/Repositories"
import { VerifyView } from "../views/Verify"

const _ = Html

/**
 * Get dashboard statistics
 */
function getDashboardStats(db: DB): DashboardStats {
  const pluginsTable = getPluginsTable(db)
  const versionsTable = getPluginVersionsTable(db)
  const verificationsTable = getVerificationsTable(db)

  const totalPlugins = pluginsTable.select(["id"]).all().length
  const totalVersions = versionsTable.select(["id"]).all().length

  // Get verified versions count
  const verifiedVersions = verificationsTable.select(["id"]).where({ verified: true }).all().length

  // Get safe plugins count
  const safePlugins = verificationsTable
    .select(["id"])
    .where({ security_status: "safe" })
    .all().length

  const unsafePlugins = verificationsTable
    .select(["id"])
    .where({ security_status: "unsafe" })
    .all().length

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

  const totalRepositories = getRepositoryTable(db).select(["id"]).all().length

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
 * Create page routes
 */
export function createPageRoutes(db: DB) {
  return (
    new Elysia()
      // Dashboard
      .get("/", () => {
        const stats = getDashboardStats(db)
        const recentPlugins = getPluginsWithVerification(db).slice(0, 10)
        const repositories = getRepositoriesWithStats(db)

        return <Dashboard stats={stats} recentPlugins={recentPlugins} repositories={repositories} />
      })

      // Plugins list
      .get("/plugins", ({ query, headers }) => {
        const filter = (query.filter as string) || "all"
        const search = (query.search as string) || ""
        const view = ((query.view as string) || "table") as "table" | "grid"

        let plugins = getPluginsWithVerification(db, filter === "all" ? undefined : filter)

        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase()
          plugins = plugins.filter(
            (p) =>
              p.plugin_name.toLowerCase().includes(searchLower) ||
              p.description.toLowerCase().includes(searchLower) ||
              p.author_name.toLowerCase().includes(searchLower)
          )
        }

        // Check if this is an HTMX request
        const isHtmx = headers["hx-request"] === "true"

        if (isHtmx) {
          // Return just the content for HTMX updates
          return <PluginsContent plugins={plugins} view={view} />
        }

        return (
          <PluginsView
            plugins={plugins}
            filter={filter as "all" | "verified" | "unverified" | "safe" | "unsafe"}
            search={search}
            view={view}
          />
        )
      })

      // Plugin detail
      .get("/plugins/:id", ({ params, set }) => {
        const plugins = getPluginsWithVerification(db)
        const plugin = plugins.find((p) => p.plugin_id === Number(params.id))

        if (!plugin) {
          set.status = 404
          return (
            <div class="text-center py-16">
              <h1 class="text-2xl font-bold text-white">Plugin not found</h1>
              <a href="/plugins" class="text-blue-400 hover:text-blue-300 mt-4 inline-block">
                ← Back to plugins
              </a>
            </div>
          )
        }

        return <PluginDetail plugin={plugin} />
      })

      // Repositories list
      .get("/repositories", () => {
        const repositories = getRepositoriesWithStats(db)
        return <RepositoriesView repositories={repositories} />
      })

      // Repository detail
      .get("/repositories/:id", ({ params, set }) => {
        const repositories = getRepositoriesWithStats(db)
        const repository = repositories.find((r) => r.id === Number(params.id))

        if (!repository) {
          set.status = 404
          return (
            <div class="text-center py-16">
              <h1 class="text-2xl font-bold text-white">Repository not found</h1>
              <a href="/repositories" class="text-blue-400 hover:text-blue-300 mt-4 inline-block">
                ← Back to repositories
              </a>
            </div>
          )
        }

        return <RepositoryDetail repository={repository} />
      })

      // Add repository form
      .get("/repositories/add", () => {
        return <AddRepositoryView />
      })

      // Verify page
      .get("/verify", () => {
        // Get all unverified plugin versions
        const pendingPlugins = getPluginsWithVerification(db, "unverified")
        return <VerifyView pendingPlugins={pendingPlugins} />
      })
  )
}
