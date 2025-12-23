import Logger from "@dockstat/logger"
import type { PluginMetaType } from "@dockstat/typings/types"
import { hashString } from "./hash"

const logger = new Logger("Repository-Service")

/**
 * Repository manifest structure
 */
export interface RepoManifest {
  plugins: PluginMetaType[]
}

/**
 * Fetched plugin with computed hashes
 */
export interface FetchedPlugin {
  meta: PluginMetaType
  sourceHash: string
  bundleHash?: string
  fetchedAt: number
}

/**
 * Repository fetch result
 */
export interface RepositoryFetchResult {
  success: boolean
  url: string
  plugins: FetchedPlugin[]
  error?: string
  fetchedAt: number
}

/**
 * Parse repository URL to get the raw content URL
 * Supports GitHub, GitLab, and HTTP URLs
 */
function getManifestUrl(repoUrl: string): string {
  // GitHub format: owner/repo:branch/path or owner/repo/path
  if (repoUrl.includes("github.com") || !repoUrl.includes("://")) {
    const match = repoUrl.match(/^([^/:]+\/[^/:]+)(?::([^/]+))?(?:\/(.*))?$/)
    if (match) {
      const [, repo, branch = "main", path = ""] = match
      const manifestPath = path ? `${path}/manifest.ts` : "manifest.ts"
      return `https://raw.githubusercontent.com/${repo}/${branch}/${manifestPath}`
    }
  }

  // GitLab format
  if (repoUrl.includes("gitlab.com")) {
    const match = repoUrl.match(/gitlab\.com\/([^/:]+\/[^/:]+)(?::([^/]+))?(?:\/(.*))?/)
    if (match) {
      const [, repo, branch = "main", path = ""] = match
      const manifestPath = path ? `${path}/manifest.ts` : "manifest.ts"
      return `https://gitlab.com/${repo}/-/raw/${branch}/${manifestPath}`
    }
  }

  // HTTP(S) URL - assume it's a direct link to manifest
  if (repoUrl.startsWith("http://") || repoUrl.startsWith("https://")) {
    return repoUrl.endsWith("/manifest.ts") ? repoUrl : `${repoUrl}/manifest.ts`
  }

  throw new Error(`Unsupported repository URL format: ${repoUrl}`)
}

/**
 * Fetch and parse a repository manifest
 */
export async function fetchRepositoryManifest(repoUrl: string): Promise<RepoManifest> {
  const manifestUrl = getManifestUrl(repoUrl)
  logger.info(`Fetching manifest from: ${manifestUrl}`)

  try {
    const response = await fetch(manifestUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`)
    }

    const content = await response.text()

    // Parse the TypeScript manifest
    // Extract the plugins array from the manifest content
    const pluginsMatch = content.match(/plugins:\s*(\[[\s\S]*?\])\s*(?:}|as const)/)
    if (!pluginsMatch || !pluginsMatch[1]) {
      throw new Error("Could not parse plugins from manifest")
    }

    // Use eval-like approach with Function constructor for safe parsing
    // This handles the JSON-like structure in the TypeScript file
    const pluginsJson = pluginsMatch[1]
      .replace(/\/\/.*$/gm, "") // Remove comments
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas

    // Parse as JSON (the manifest should export valid JSON-compatible data)
    const plugins = JSON.parse(pluginsJson) as PluginMetaType[]

    return { plugins }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to fetch repository manifest: ${repoUrl}`, errorMessage)
    throw error
  }
}

/**
 * Fetch a single plugin's source and compute its hash
 */
export async function fetchPluginSource(
  plugin: PluginMetaType,
  _baseUrl: string
): Promise<FetchedPlugin> {
  logger.info(`Fetching plugin source: ${plugin.name} v${plugin.version}`)

  try {
    // For now, we'll compute a hash from the plugin metadata
    // In a real implementation, you'd fetch the actual source files
    const metaString = JSON.stringify(plugin, null, 2)
    const sourceHash = await hashString(metaString + plugin.version)

    return {
      meta: plugin,
      sourceHash,
      bundleHash: undefined,
      fetchedAt: Date.now(),
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to fetch plugin source: ${plugin.name}`, errorMessage)
    throw error
  }
}

/**
 * Fetch all plugins from a repository
 */
export async function fetchRepository(repoUrl: string): Promise<RepositoryFetchResult> {
  logger.info(`Fetching repository: ${repoUrl}`)

  try {
    const manifest = await fetchRepositoryManifest(repoUrl)
    const plugins: FetchedPlugin[] = []

    for (const pluginMeta of manifest.plugins) {
      try {
        const fetchedPlugin = await fetchPluginSource(pluginMeta, repoUrl)
        plugins.push(fetchedPlugin)
      } catch {
        logger.warn(`Skipping plugin ${pluginMeta.name} due to fetch error`)
      }
    }

    return {
      success: true,
      url: repoUrl,
      plugins,
      fetchedAt: Date.now(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to fetch repository: ${repoUrl}`, message)

    return {
      success: false,
      url: repoUrl,
      plugins: [],
      error: message,
      fetchedAt: Date.now(),
    }
  }
}

/**
 * Sync a repository - fetch latest plugins and update database
 */
export async function syncRepository(
  repoUrl: string,
  onPlugin?: (plugin: FetchedPlugin) => Promise<void>
): Promise<RepositoryFetchResult> {
  const result = await fetchRepository(repoUrl)

  if (result.success && onPlugin) {
    for (const plugin of result.plugins) {
      await onPlugin(plugin)
    }
  }

  return result
}
