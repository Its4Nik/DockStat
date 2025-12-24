import { handleElysiaError } from "@dockstat/utils"
import { ServerAPI } from ".."
import type {
  ActionResponse,
  BatchVerificationResult,
  ConfigRepository,
  InstalledPlugin,
  LocalVerificationStatus,
  PluginsLoaderData,
  VerificationApiResult,
} from "../../components/plugins/types"

// Action intent types
type PluginsAction =
  | { intent: "plugin:install"; manifestUrl: string }
  | { intent: "plugin:delete"; pluginId: number }
  | { intent: "plugin:activate"; pluginIds: number[] }
  | { intent: "plugin:deactivate"; pluginId: number }
  | {
      intent: "repository:add"
      name: string
      source: string
      type: string
      policy: string
      verificationApi: string
      isVerified: boolean
    }
  | {
      intent: "repository:edit"
      id: number
      name: string
      source: string
      type: string
      policy: string
      verificationApi: string
      isVerified: boolean
    }
  | { intent: "repository:delete"; repoId: number }
  | { intent: "repository:sync"; repoId: number }
  | { intent: "repository:toggle"; repoId: number }

// Default verification API URL - can be overridden per repository
const DEFAULT_VERIFICATION_API = process.env.VERIFICATION_API_URL || "http://localhost:3100"

/**
 * Compute a SHA-256 hash for plugin verification
 * This MUST match the hash computation used by dockstore-verification service
 */
async function computePluginHash(plugin: InstalledPlugin): Promise<string> {
  // Match the exact format used by dockstore-verification
  const metaString = JSON.stringify(
    {
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      author: plugin.author,
      repository: plugin.repository,
      repoType: plugin.repoType,
      manifest: plugin.manifest,
      tags: plugin.tags,
    },
    null,
    2
  )
  const data = new TextEncoder().encode(metaString + plugin.version)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Verify a single plugin against the verification API
 * No caching - always fetches fresh verification status
 */
async function verifyPluginWithApi(
  plugin: InstalledPlugin,
  verificationApiUrl: string
): Promise<VerificationApiResult> {
  const pluginHash = await computePluginHash(plugin)

  try {
    const response = await fetch(`${verificationApiUrl}/api/compare`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pluginName: plugin.name,
        pluginHash: pluginHash,
        pluginVersion: plugin.version,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      // Handle 404 specifically - plugin not found in verification database
      if (response.status === 404) {
        const data = (await response.json()) as VerificationApiResult
        return {
          valid: false,
          pluginName: plugin.name,
          pluginVersion: plugin.version,
          hash: pluginHash,
          verified: false,
          securityStatus: "unknown",
          message: data.message || "Plugin hash not found in verification database",
        }
      }
      throw new Error(`Verification API returned ${response.status}`)
    }

    return (await response.json()) as VerificationApiResult
  } catch (error) {
    // Return unknown status if API is unavailable
    return {
      valid: false,
      pluginName: plugin.name,
      pluginVersion: plugin.version,
      hash: pluginHash,
      verified: false,
      securityStatus: "unknown",
      message:
        error instanceof Error
          ? `Verification API error: ${error.message}`
          : "Failed to contact verification API",
    }
  }
}

/**
 * Verify multiple plugins in batch against the verification API
 * More efficient than individual calls when verifying many plugins
 */
async function verifyPluginsBatch(
  plugins: InstalledPlugin[],
  verificationApiUrl: string
): Promise<BatchVerificationResult> {
  const pluginData = await Promise.all(
    plugins.map(async (plugin) => ({
      pluginName: plugin.name,
      pluginHash: await computePluginHash(plugin),
      pluginVersion: plugin.version,
    }))
  )

  try {
    const response = await fetch(`${verificationApiUrl}/api/compare/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plugins: pluginData }),
      signal: AbortSignal.timeout(30000), // Longer timeout for batch
    })

    if (!response.ok) {
      throw new Error(`Verification API returned ${response.status}`)
    }

    return (await response.json()) as BatchVerificationResult
  } catch (error) {
    // Fallback to individual verification if batch fails
    const results: VerificationApiResult[] = await Promise.all(
      plugins.map((plugin) => verifyPluginWithApi(plugin, verificationApiUrl))
    )

    return {
      results,
      summary: {
        total: results.length,
        verified: results.filter((r) => r.verified).length,
        safe: results.filter((r) => r.securityStatus === "safe").length,
        unsafe: results.filter((r) => r.securityStatus === "unsafe").length,
        unknown: results.filter((r) => r.securityStatus === "unknown").length,
        allSafe: results.every((r) => r.verified && r.securityStatus === "safe"),
        hasUnsafe: results.some((r) => r.securityStatus === "unsafe"),
      },
    }
  }
}

/**
 * Convert API verification result to local verification status
 */
function apiResultToLocalStatus(
  result: VerificationApiResult,
  repository: ConfigRepository | null
): LocalVerificationStatus {
  return {
    isVerified: result.verified,
    securityStatus: result.securityStatus,
    hash: result.hash,
    cachedHash: null, // No longer using cached hashes
    matchesCache: result.valid,
    repository: repository?.name || null,
    policy: repository?.policy || null,
    message: result.message,
    verifiedBy: result.verifiedBy,
    verifiedAt: result.verifiedAt,
    notes: result.notes,
  }
}

/**
 * Verify a plugin - determines which verification method to use based on repository config
 */
async function verifyPlugin(
  plugin: InstalledPlugin,
  repositories: ConfigRepository[]
): Promise<LocalVerificationStatus> {
  // Find the repository this plugin belongs to
  const repo = repositories.find(
    (r) =>
      plugin.repository === r.name ||
      plugin.repository === r.source ||
      plugin.repoType === r.type ||
      r.name.toLowerCase() === "default"
  )

  // If no repo found, use default verification API
  if (!repo) {
    const result = await verifyPluginWithApi(plugin, DEFAULT_VERIFICATION_API)
    return apiResultToLocalStatus(result, null)
  }

  // Relaxed policy - no verification needed
  if (repo.policy === "relaxed") {
    const pluginHash = await computePluginHash(plugin)
    return {
      isVerified: true,
      securityStatus: "safe",
      hash: pluginHash,
      cachedHash: null,
      matchesCache: true,
      repository: repo.name,
      policy: "relaxed",
      message: "Repository uses relaxed policy - verification skipped",
    }
  }

  // Strict policy - verify with API
  const verificationApiUrl = repo.verification_api || DEFAULT_VERIFICATION_API
  const result = await verifyPluginWithApi(plugin, verificationApiUrl)
  return apiResultToLocalStatus(result, repo)
}

/**
 * Verify all plugins efficiently using batch API when possible
 */
async function verifyAllPlugins(
  plugins: InstalledPlugin[],
  repositories: ConfigRepository[]
): Promise<Record<number, LocalVerificationStatus>> {
  const verifications: Record<number, LocalVerificationStatus> = {}

  // Group plugins by their verification API endpoint
  const pluginsByApi = new Map<
    string,
    { plugin: InstalledPlugin; repo: ConfigRepository | null }[]
  >()

  for (const plugin of plugins) {
    const repo = repositories.find(
      (r) =>
        plugin.repository === r.name ||
        plugin.repository === r.source ||
        plugin.repoType === r.type ||
        r.name.toLowerCase() === "default"
    )

    // Handle relaxed policy immediately
    if (repo?.policy === "relaxed") {
      const pluginHash = await computePluginHash(plugin)
      verifications[plugin.id] = {
        isVerified: true,
        securityStatus: "safe",
        hash: pluginHash,
        cachedHash: null,
        matchesCache: true,
        repository: repo.name,
        policy: "relaxed",
        message: "Repository uses relaxed policy - verification skipped",
      }
      continue
    }

    const apiUrl = repo?.verification_api || DEFAULT_VERIFICATION_API
    const existing = pluginsByApi.get(apiUrl) || []
    existing.push({ plugin, repo: repo || null })
    pluginsByApi.set(apiUrl, existing)
  }

  // Verify each group using batch API
  for (const [apiUrl, pluginsWithRepos] of pluginsByApi) {
    const pluginsToVerify = pluginsWithRepos.map((p) => p.plugin)

    if (pluginsToVerify.length === 1) {
      // Single plugin - use individual verification
      const result = await verifyPluginWithApi(pluginsToVerify[0], apiUrl)
      verifications[pluginsToVerify[0].id] = apiResultToLocalStatus(
        result,
        pluginsWithRepos[0].repo
      )
    } else {
      // Multiple plugins - use batch verification
      const batchResult = await verifyPluginsBatch(pluginsToVerify, apiUrl)

      for (let i = 0; i < pluginsToVerify.length; i++) {
        const plugin = pluginsToVerify[i]
        const result = batchResult.results[i]
        const repo = pluginsWithRepos[i].repo
        verifications[plugin.id] = apiResultToLocalStatus(result, repo)
      }
    }
  }

  return verifications
}

// Parse form data into typed action
function parseFormData(formData: FormData): PluginsAction | null {
  const intent = formData.get("intent") as string

  switch (intent) {
    case "plugin:install": {
      const manifestUrl = formData.get("manifestUrl") as string
      if (!manifestUrl) return null
      return { intent, manifestUrl }
    }

    case "plugin:delete": {
      const pluginId = Number(formData.get("pluginId"))
      if (Number.isNaN(pluginId)) return null
      return { intent, pluginId }
    }

    case "plugin:activate": {
      const pluginIdsStr = formData.get("pluginIds") as string
      if (!pluginIdsStr) return null
      const pluginIds = pluginIdsStr
        .split(",")
        .map(Number)
        .filter((n) => !Number.isNaN(n))
      if (pluginIds.length === 0) return null
      return { intent, pluginIds }
    }

    case "plugin:deactivate": {
      const pluginId = Number(formData.get("pluginId"))
      if (Number.isNaN(pluginId)) return null
      return { intent, pluginId }
    }

    case "repository:add": {
      const name = formData.get("name") as string
      const source = formData.get("source") as string
      const type = (formData.get("type") as string) || "github"
      const policy = (formData.get("policy") as string) || "strict"
      const verificationApi = (formData.get("verificationApi") as string) || ""
      const isVerified = formData.get("isVerified") === "true"
      if (!name || !source) return null
      return { intent, name, source, type, policy, verificationApi, isVerified }
    }

    case "repository:edit": {
      const id = Number(formData.get("id"))
      const name = formData.get("name") as string
      const source = formData.get("source") as string
      const type = (formData.get("type") as string) || "github"
      const policy = (formData.get("policy") as string) || "strict"
      const verificationApi = (formData.get("verificationApi") as string) || ""
      const isVerified = formData.get("isVerified") === "true"
      if (Number.isNaN(id) || !name || !source) return null
      return { intent, id, name, source, type, policy, verificationApi, isVerified }
    }

    case "repository:delete": {
      const repoId = Number(formData.get("repoId"))
      if (Number.isNaN(repoId)) return null
      return { intent, repoId }
    }

    case "repository:sync": {
      const repoId = Number(formData.get("repoId"))
      if (Number.isNaN(repoId)) return null
      return { intent, repoId }
    }

    case "repository:toggle": {
      const repoId = Number(formData.get("repoId"))
      if (Number.isNaN(repoId)) return null
      return { intent, repoId }
    }

    default:
      return null
  }
}

export const Plugins = {
  loader: async (): Promise<PluginsLoaderData> => {
    // Fetch installed plugins from API
    const pluginsRes = await ServerAPI.plugins.all.get()
    const statusRes = await ServerAPI.plugins.status.get()
    // Fetch repositories from the new repositories API endpoint
    const repositoriesRes = await ServerAPI.db.repositories.get()

    const plugins: InstalledPlugin[] =
      pluginsRes.status === 200 && Array.isArray(pluginsRes.data)
        ? (pluginsRes.data as InstalledPlugin[])
        : []

    // Get loaded plugin IDs from status
    const loadedPlugins =
      statusRes.status === 200 && statusRes.data?.loaded_plugins
        ? (statusRes.data.loaded_plugins as InstalledPlugin[])
        : []
    const loadedPluginIds = loadedPlugins.map((p) => p.id)

    // Get repositories from the new API
    const repositories: ConfigRepository[] =
      repositoriesRes.status === 200 && repositoriesRes.data?.data
        ? (repositoriesRes.data.data as ConfigRepository[])
        : []

    // Verify all plugins against the verification API (no caching)
    const verifications = await verifyAllPlugins(plugins, repositories)

    // Calculate stats
    const verifiedCount = Object.values(verifications).filter((v) => v.isVerified).length
    const safeCount = Object.values(verifications).filter((v) => v.securityStatus === "safe").length
    const unsafeCount = Object.values(verifications).filter(
      (v) => v.securityStatus === "unsafe"
    ).length

    return {
      plugins,
      loadedPluginIds,
      repositories,
      verifications,
      stats: {
        totalPlugins: plugins.length,
        loadedPlugins: loadedPluginIds.length,
        verifiedPlugins: verifiedCount,
        safePlugins: safeCount,
        unsafePlugins: unsafeCount,
        totalRepositories: repositories.length,
      },
    }
  },

  action: async ({ request }: { request: Request }): Promise<ActionResponse> => {
    try {
      const formData = await request.formData()
      const action = parseFormData(formData)

      if (!action) {
        return { success: false, error: "Invalid action or missing required fields" }
      }

      switch (action.intent) {
        // ==================== Plugin Actions ====================
        case "plugin:install": {
          // Install from manifest URL - needs API endpoint
          return {
            success: false,
            error: "Plugin installation is not yet implemented",
          }
        }

        case "plugin:delete": {
          const res = await ServerAPI.plugins.delete.post({
            pluginId: action.pluginId,
          })
          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message: "Plugin deleted successfully",
            }
          }
          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to delete plugin"),
          }
        }

        case "plugin:activate": {
          // Before activating, verify the plugins
          const pluginsRes = await ServerAPI.plugins.all.get()
          const repositoriesRes = await ServerAPI.db.repositories.get()

          if (pluginsRes.status !== 200) {
            return {
              success: false,
              error: "Failed to fetch plugins for verification",
            }
          }

          const allPlugins = pluginsRes.data as InstalledPlugin[]
          const repositories =
            repositoriesRes.status === 200 && repositoriesRes.data?.data
              ? (repositoriesRes.data.data as ConfigRepository[])
              : []

          // Verify each plugin to be activated
          const pluginsToActivate = allPlugins.filter((p) => action.pluginIds.includes(p.id))
          const unsafePlugins: string[] = []

          for (const plugin of pluginsToActivate) {
            const verification = await verifyPlugin(plugin, repositories)
            if (verification.securityStatus === "unsafe") {
              unsafePlugins.push(plugin.name)
            }
          }

          // Warn but don't block if there are unsafe plugins
          if (unsafePlugins.length > 0) {
            console.warn(`Warning: Activating unsafe plugins: ${unsafePlugins.join(", ")}`)
          }

          const res = await ServerAPI.plugins.activate.post(action.pluginIds)
          if (res.status === 200) {
            return {
              success: true,
              data: res.data,
              message:
                unsafePlugins.length > 0
                  ? `${action.pluginIds.length} plugin(s) activated. Warning: ${unsafePlugins.join(", ")} marked as unsafe.`
                  : `${action.pluginIds.length} plugin(s) activated`,
            }
          }
          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to activate plugins"),
          }
        }

        case "plugin:deactivate": {
          return {
            success: false,
            error: "Plugin deactivation is not yet implemented",
          }
        }

        // ==================== Repository Actions ====================
        case "repository:add": {
          const res = await ServerAPI.db.repositories.post({
            name: action.name,
            source: action.source,
            type: action.type as ConfigRepository["type"],
            policy: action.policy as ConfigRepository["policy"],
            verification_api: action.verificationApi || null,
            isVerified: action.isVerified,
            hashes: null, // No longer storing hashes
          })

          if (res.status === 201) {
            return {
              success: true,
              message: `Repository "${action.name}" added successfully`,
              data: res.data?.data,
            }
          }

          if (res.status === 409) {
            return {
              success: false,
              error: `Repository "${action.name}" already exists`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to create repository"),
          }
        }

        case "repository:edit": {
          const res = await ServerAPI.db.repositories({ id: String(action.id) }).put({
            id: action.id,
            name: action.name,
            source: action.source,
            type: action.type as ConfigRepository["type"],
            policy: action.policy as ConfigRepository["policy"],
            verification_api: action.verificationApi || null,
            isVerified: action.isVerified,
          })

          if (res.status === 200) {
            return {
              success: true,
              message: `Repository "${action.name}" updated successfully`,
              data: res.data?.data,
            }
          }

          if (res.status === 404) {
            return {
              success: false,
              error: "Repository not found",
            }
          }

          if (res.status === 409) {
            return {
              success: false,
              error: `Repository with name "${action.name}" already exists`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to update repository"),
          }
        }

        case "repository:delete": {
          const res = await ServerAPI.db.repositories({ id: String(action.repoId) }).delete()

          if (res.status === 200) {
            return {
              success: true,
              message: res.data?.message || "Repository deleted successfully",
            }
          }

          if (res.status === 404) {
            return {
              success: false,
              error: "Repository not found",
            }
          }

          return {
            success: false,
            error: handleElysiaError(res.error, "Failed to delete repository"),
          }
        }

        case "repository:sync": {
          // TODO: Implement fetching plugins from repository source
          return {
            success: false,
            error: "Repository sync is not yet implemented",
          }
        }

        case "repository:toggle": {
          // First get the current repository
          const getRes = await ServerAPI.db.repositories({ id: String(action.repoId) }).get()

          if (getRes.status !== 200 || !getRes.data?.data) {
            return {
              success: false,
              error: "Repository not found",
            }
          }

          const repo = getRes.data.data as ConfigRepository

          // Toggle the isVerified status
          const updateRes = await ServerAPI.db.repositories({ id: String(action.repoId) }).put({
            id: action.repoId,
            isVerified: !repo.isVerified,
          })

          if (updateRes.status === 200) {
            return {
              success: true,
              message: `Repository "${repo.name}" ${repo.isVerified ? "unverified" : "verified"} successfully`,
            }
          }

          return {
            success: false,
            error: handleElysiaError(updateRes.error, "Failed to toggle repository"),
          }
        }

        default: {
          return { success: false, error: "Unknown action" }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }
    }
  },
}
