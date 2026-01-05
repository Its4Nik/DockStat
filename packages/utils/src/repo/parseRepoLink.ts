import type { RepoType } from "@dockstat/typings/types"

function parseRepoParts(source: string) {
  const [ownerRepo, branchAndPath] = source.split(":")

  if (!ownerRepo) {
    throw new Error(`No parsable Repo found in ${source}`)
  }

  const parts = branchAndPath?.split("/") || []
  const branch = parts[0]
  // Fixes potential bug with deep paths by joining remaining segments
  const path = parts.slice(1).join("/")

  return { ownerRepo, branch, path }
}

function toGitHub(source: string) {
  const { ownerRepo, branch, path } = parseRepoParts(source)
  return `https://raw.githubusercontent.com/${ownerRepo}/refs/heads/${branch}/${path}/manifest.yaml`
}

export function parseFromDBToRepoLink(type: RepoType["type"], source: string) {
  switch (type) {
    case "http":
      return source

    case "github":
      return toGitHub(source)

    case "gitlab": {
      const cleanSource = source.replace("gitlab://", "")
      const { ownerRepo, branch, path } = parseRepoParts(cleanSource)
      return `https://gitlab.com/${ownerRepo}/-/raw/${branch}/${path}/manifest.yaml`
    }

    case "gitea": {
      const cleanSource = source.replace("gitea://", "")
      const { ownerRepo, branch, path } = parseRepoParts(cleanSource)
      // Replace with your specific Gitea domain if needed
      const domain = "gitea.com"
      return `https://${domain}/${ownerRepo}/raw/branch/${branch}/${path}/manifest.yaml`
    }

    default:
      throw new Error(`Unsupported repo type: ${type}`)
  }
}
