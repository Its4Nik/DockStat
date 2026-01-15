import type { RepoType } from "@dockstat/typings/types"

function parseRepoParts(source: string) {
  const [ownerRepo, branchAndPath] = source.split(":")

  if (!ownerRepo) {
    throw new Error(`No parsable Repo found in ${source}`)
  }

  const parts = branchAndPath?.split("/") || []
  const branch = parts[0]
  const path = parts.slice(1).join("/")

  return { ownerRepo, branch, path }
}

export function parseFromDBToRepoLink(
  type: RepoType["type"],
  source: string,
  file = "manifest.yaml",
  raw = true
) {
  switch (type) {
    case "default":
      return source

    case "http":
      return source

    case "github": {
      const { ownerRepo, branch, path } = parseRepoParts(source)
      if (raw) {
        return `https://raw.githubusercontent.com/${ownerRepo}/refs/heads/${branch}/${path}/${file}`
      }
      return `https://github.com/${ownerRepo}/tree/${branch}/${path}`
    }

    case "gitlab": {
      const cleanSource = source.replace("gitlab://", "")
      const { ownerRepo, branch, path } = parseRepoParts(cleanSource)
      if (raw) {
        return `https://gitlab.com/${ownerRepo}/-/raw/${branch}/${path}/${file}`
      }
      return `https://gitlab.com/${ownerRepo}/-/tree/${branch}/${path}`
    }

    case "gitea": {
      const cleanSource = source.replace("gitea://", "")
      const { ownerRepo, branch, path } = parseRepoParts(cleanSource)
      const domain = "gitea.com"
      if (raw) {
        return `https://${domain}/${ownerRepo}/raw/branch/${branch}/${path}/${file}`
      }
      return `https://${domain}/${ownerRepo}/src/branch/${branch}/${path}`
    }

    default:
      throw new Error(`Unsupported repo type: ${type}`)
  }
}
