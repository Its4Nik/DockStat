/**
 * URL utility functions for converting repository strings to viewable URLs
 */

/**
 * Parse a repository string and return the appropriate viewable URL
 *
 * Supports the following formats:
 * - GitHub: "owner/repo:branch/path" or "owner/repo/path" or "owner/repo"
 * - GitLab: "gitlab.com/owner/repo:branch/path"
 * - HTTP(S): Direct URLs
 *
 * @param repoString - The repository string in custom format
 * @param repoType - The type of repository ("github" | "gitlab" | "http")
 * @returns The viewable URL for the repository
 */
export function getViewableRepositoryUrl(
  repoString: string,
  repoType: "github" | "gitlab" | "http"
): string {
  if (!repoString) {
    return "#"
  }

  // If it's already a full URL, return it
  if (repoString.startsWith("http://") || repoString.startsWith("https://")) {
    return repoString
  }

  switch (repoType) {
    case "github":
      return parseGitHubUrl(repoString)
    case "gitlab":
      return parseGitLabUrl(repoString)
    case "http":
      // For HTTP type, if it's not already a URL, try to make it one
      if (!repoString.startsWith("http")) {
        return `https://${repoString}`
      }
      return repoString
    default:
      return repoString
  }
}

/**
 * Parse a GitHub repository string to a viewable URL
 *
 * Format: "owner/repo:branch/path" or "owner/repo/path" or "owner/repo"
 *
 * @param repoString - The GitHub repository string
 * @returns The GitHub URL
 */
function parseGitHubUrl(repoString: string): string {
  // Format: owner/repo:branch/path
  const branchMatch = repoString.match(/^([^/:]+\/[^/:]+):([^/]+)(?:\/(.*))?$/)
  if (branchMatch) {
    const [, repo, branch, path] = branchMatch
    if (path) {
      return `https://github.com/${repo}/tree/${branch}/${path}`
    }
    return `https://github.com/${repo}/tree/${branch}`
  }

  // Format: owner/repo/path (assumes main branch)
  const pathMatch = repoString.match(/^([^/]+\/[^/]+)(?:\/(.+))?$/)
  if (pathMatch) {
    const [, repo, path] = pathMatch
    if (path) {
      return `https://github.com/${repo}/tree/main/${path}`
    }
    return `https://github.com/${repo}`
  }

  // Fallback: assume it's just owner/repo
  return `https://github.com/${repoString}`
}

/**
 * Parse a GitLab repository string to a viewable URL
 *
 * Format: "gitlab.com/owner/repo:branch/path" or "owner/repo:branch/path"
 *
 * @param repoString - The GitLab repository string
 * @returns The GitLab URL
 */
function parseGitLabUrl(repoString: string): string {
  // Check if it already refers to gitlab.com by parsing the URL hostname
  try {
    let url: URL
    try {
      // Try parsing as an absolute URL first
      url = new URL(repoString)
    } catch {
      // If there is no scheme, assume https and try again
      url = new URL(`https://${repoString}`)
    }

    if (url.hostname === "gitlab.com") {
      const normalized = url.toString()
      // Extract and parse the path
      const match = normalized.match(/gitlab\.com\/([^/:]+\/[^/:]+)(?::([^/]+))?(?:\/(.*))?/)
      if (match) {
        const [, repo, branch, path] = match
        if (branch && path) {
          return `https://gitlab.com/${repo}/-/tree/${branch}/${path}`
        }
        if (branch) {
          return `https://gitlab.com/${repo}/-/tree/${branch}`
        }
        if (path) {
          return `https://gitlab.com/${repo}/-/tree/main/${path}`
        }
        return `https://gitlab.com/${repo}`
      }
      // Fallback: return a canonical gitlab.com URL based on the parsed path
      return `https://gitlab.com${url.pathname}`
    }
  } catch {
    // If URL parsing fails, fall through to spec-based parsing below
  }

  // Format: owner/repo:branch/path
  const branchMatch = repoString.match(/^([^/:]+\/[^/:]+):([^/]+)(?:\/(.*))?$/)
  if (branchMatch) {
    const [, repo, branch, path] = branchMatch
    if (path) {
      return `https://gitlab.com/${repo}/-/tree/${branch}/${path}`
    }
    return `https://gitlab.com/${repo}/-/tree/${branch}`
  }

  // Format: owner/repo/path (assumes main branch)
  const pathMatch = repoString.match(/^([^/]+\/[^/]+)(?:\/(.+))?$/)
  if (pathMatch) {
    const [, repo, path] = pathMatch
    if (path) {
      return `https://gitlab.com/${repo}/-/tree/main/${path}`
    }
    return `https://gitlab.com/${repo}`
  }

  // Fallback
  return `https://gitlab.com/${repoString}`
}

/**
 * Get the icon/badge type for a repository based on its URL
 *
 * @param url - The repository URL or string
 * @returns The repository type for badge styling
 */
export function detectRepoType(url: string): "github" | "gitlab" | "http" {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes("github")) {
    return "github"
  }
  if (lowerUrl.includes("gitlab")) {
    return "gitlab"
  }
  return "http"
}
