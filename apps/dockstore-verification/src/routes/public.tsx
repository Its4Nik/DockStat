import type { DB } from "@dockstat/sqlite-wrapper"
import { Html } from "@elysiajs/html"
import { Elysia, t } from "elysia"
import { getPluginsTable, getPluginVersionsTable, getVerificationsTable } from "../db"
import type { PluginVerificationView } from "../db/types"
import {
  PublicDashboard,
  PublicPluginList,
  type PublicDashboardStats,
} from "../views/PublicDashboard"

const _ = Html

/**
 * Get public dashboard statistics (no sensitive data)
 */
function getPublicStats(db: DB): PublicDashboardStats {
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

  return {
    totalPlugins,
    verifiedPlugins: verifiedPlugins?.count || 0,
    totalVersions,
    verifiedVersions,
    safePlugins,
    unsafePlugins,
  }
}

/**
 * Get plugins with verification status for public view
 */
function getPublicPlugins(db: DB, filter?: string, search?: string): PluginVerificationView[] {
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

  const conditions: string[] = []

  if (filter === "verified") {
    conditions.push("v.verified = 1")
  } else if (filter === "unverified") {
    conditions.push("(v.verified IS NULL OR v.verified = 0)")
  } else if (filter === "safe") {
    conditions.push("v.security_status = 'safe'")
  } else if (filter === "unsafe") {
    conditions.push("v.security_status = 'unsafe'")
  }

  if (search) {
    // Escape single quotes in search term for SQL safety
    const escapedSearch = search.replace(/'/g, "''").toLowerCase()
    conditions.push(
      `(LOWER(p.name) LIKE '%${escapedSearch}%' OR LOWER(p.description) LIKE '%${escapedSearch}%' OR LOWER(p.author_name) LIKE '%${escapedSearch}%')`
    )
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`
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
 * Create public routes (no authentication required)
 */
export function createPublicRoutes(db: DB) {
  return (
    new Elysia({ prefix: "/public" })
      // Public dashboard page
      .get("/", () => {
        const stats = getPublicStats(db)
        const plugins = getPublicPlugins(db)

        return <PublicDashboard stats={stats} plugins={plugins} />
      })

      // Public plugin list (for HTMX partial updates)
      .get(
        "/plugins",
        ({ query, headers }) => {
          const filter = query.filter as string | undefined
          const search = query.search as string | undefined

          const plugins = getPublicPlugins(db, filter === "all" ? undefined : filter, search)

          // Group plugins by name to show latest version of each
          const latestPlugins = plugins.reduce(
            (acc, plugin) => {
              if (!acc[plugin.plugin_name]) {
                acc[plugin.plugin_name] = plugin
              }
              return acc
            },
            {} as Record<string, PluginVerificationView>
          )

          const pluginList = Object.values(latestPlugins)

          // Check if this is an HTMX request
          const isHtmx = headers["hx-request"] === "true"

          if (isHtmx) {
            // Return just the plugin list for HTMX updates
            return <PublicPluginList plugins={pluginList} />
          }

          // Full page response
          const stats = getPublicStats(db)
          return <PublicDashboard stats={stats} plugins={plugins} />
        },
        {
          query: t.Object({
            filter: t.Optional(t.String()),
            search: t.Optional(t.String()),
          }),
        }
      )

      // Public API endpoint for plugin list
      .get(
        "/api/plugins",
        ({ query }) => {
          const filter = query.filter as string | undefined
          const search = query.search as string | undefined

          const plugins = getPublicPlugins(db, filter === "all" ? undefined : filter, search)

          // Group plugins by name to show latest version of each
          const latestPlugins = plugins.reduce(
            (acc, plugin) => {
              if (!acc[plugin.plugin_name]) {
                acc[plugin.plugin_name] = plugin
              }
              return acc
            },
            {} as Record<string, PluginVerificationView>
          )

          return {
            plugins: Object.values(latestPlugins).map((p) => ({
              name: p.plugin_name,
              version: p.version,
              description: p.description,
              author: p.author_name,
              hash: p.version_hash,
              verified: p.verified,
              securityStatus: p.security_status,
              verifiedBy: p.verified_by,
              verifiedAt: p.verified_at,
            })),
            total: Object.keys(latestPlugins).length,
          }
        },
        {
          query: t.Object({
            filter: t.Optional(t.String()),
            search: t.Optional(t.String()),
          }),
          detail: {
            summary: "List Plugins (Public)",
            description:
              "Get a list of all plugins with their verification status. This endpoint is public and does not require authentication.",
            tags: ["Public"],
          },
        }
      )

      // Public API endpoint for stats
      .get("/api/stats", () => {
        const stats = getPublicStats(db)
        return stats
      })
  )
}
