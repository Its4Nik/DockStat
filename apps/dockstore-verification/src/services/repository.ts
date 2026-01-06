import type { PluginMetaType } from "@dockstat/typings/types"
import { YAML } from "bun"
import BaseLogger from "../base-logger"
import { hashString } from "@dockstat/utils"

const logger = BaseLogger.spawn("Repository-Service")

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
  // If this looks like a full URL, use URL parsing to safely inspect the host
  if (repoUrl.startsWith("http://") || repoUrl.startsWith("https://")) {
    let parsed: URL
    try {
      parsed = new URL(repoUrl)
    } catch {
      throw new Error(`Unsupported repository URL format: ${repoUrl}`)
    }

    const hostname = parsed.hostname

    // GitHub full URL format: https://github.com/owner/repo[:branch]/path
    if (hostname === "github.com") {
      const pathMatch = parsed.pathname.match(/^\/([^/]+\/[^/]+)(?::([^/]+))?(?:\/(.*))?$/)
      if (pathMatch) {
        const [, repo, branch = "main", path = ""] = pathMatch
        const manifestPath = path ? `${path}/manifest.yaml` : "manifest.yaml"
        return `https://raw.githubusercontent.com/${repo}/${branch}/${manifestPath}`
      }
    }

    // GitLab full URL format: https://gitlab.com/owner/repo[:branch]/path
    if (hostname === "gitlab.com") {
      const pathMatch = parsed.pathname.match(/^\/([^/]+\/[^/]+)(?::([^/]+))?(?:\/(.*))?$/)
      if (pathMatch) {
        const [, repo, branch = "main", path = ""] = pathMatch
        const manifestPath = path ? `${path}/manifest.yaml` : "manifest.yaml"
        return `https://gitlab.com/${repo}/-/raw/${branch}/${manifestPath}`
      }
    }

    // Other HTTP(S) URL - assume it's a direct link to manifest
    const baseUrl = repoUrl
    return baseUrl.endsWith("/manifest.yaml") ? baseUrl : `${baseUrl}/manifest.yaml`
  }

  // GitHub short format: owner/repo:branch/path or owner/repo/path
  const shortGithubMatch = repoUrl.match(/^([^/:]+\/[^/:]+)(?::([^/]+))?(?:\/(.*))?$/)
  if (shortGithubMatch) {
    const [, repo, branch = "main", path = ""] = shortGithubMatch
    const manifestPath = path ? `${path}/manifest.yaml` : "manifest.yaml"
    return `https://raw.githubusercontent.com/${repo}/${branch}/${manifestPath}`
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
    const response = await fetch(manifestUrl, { method: "GET" })

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`)
    }

    const content = await response.text()

    logger.debug(JSON.stringify(content))

    const manifest = YAML.parse(content) as RepoManifest

    if (!manifest || !Array.isArray(manifest.plugins)) {
      throw new Error("Invalid manifest format: missing plugins array")
    }

    return manifest
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
    const metaString = plugin.description + plugin.repository
    logger.debug(`Hashing string: ${metaString} + ${plugin.version}`)
    const sourceHash = await hashString(
      (metaString + plugin.version).replaceAll("\n", ":::").replaceAll(" ", "/x/")
    )
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
