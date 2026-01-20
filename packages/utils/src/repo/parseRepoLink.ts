import type { RepoType } from "@dockstat/typings/types"
import { splitDomain } from "./helper"

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
  file = "repo.json",
  raw = true
) {
  switch (type) {
    case "http":
      return source

    case "github": {
      const { ownerRepo, branch, path } = parseRepoParts(source)
      return raw
        ? `https://raw.githubusercontent.com/${ownerRepo}/refs/heads/${branch?.replaceAll("heads/", "")}/${path}/${file}`
        : `https://github.com/${ownerRepo}/tree/${branch}/${path}`
    }

    case "gitlab": {
      const clean = source.replace("gitlab://", "")
      const { domain, source: repoSource } = splitDomain(clean, "gitlab.com")
      const { ownerRepo, branch, path } = parseRepoParts(repoSource)

      return raw
        ? `https://${domain}/${ownerRepo}/-/raw/${branch}/${path}/${file}`
        : `https://${domain}/${ownerRepo}/-/tree/${branch}/${path}`
    }

    case "gitea": {
      const clean = source.replace("gitea://", "")
      const { domain, source: repoSource } = splitDomain(clean, "gitea.com")
      const { ownerRepo, branch, path } = parseRepoParts(repoSource)

      return raw
        ? `https://${domain}/${ownerRepo}/raw/branch/${branch}/${path}/${file}`
        : `https://${domain}/${ownerRepo}/src/branch/${branch}/${path}`
    }

    default:
      throw new Error(`Unsupported repo type: ${type}`)
  }
}

export function parseRawToDB(rawUrl: string): {
  type: RepoType["type"]
  source: string
} {
  const url = new URL(rawUrl)

  // HTTP (non-git)
  if (
    !url.hostname.includes("github") &&
    !url.hostname.includes("gitlab") &&
    !url.pathname.includes("/raw/")
  ) {
    return { type: "http", source: rawUrl }
  }

  // GitHub
  if (url.hostname === "raw.githubusercontent.com") {
    const [, owner, repo, , , branch, ...pathParts] = url.pathname.split("/")
    console.log({ owner, repo, branch, ...pathParts })
    const path = pathParts.slice(0, -1).join("/")
    return {
      type: "github",
      source: `${owner}/${repo}:${branch}/${path}`,
    }
  }

  // GitLab (hosted or self-hosted)
  if (url.pathname.includes("/-/raw/")) {
    const [ownerRepo, , , branch, ...pathParts] = url.pathname.replace(/^\/+/, "").split("/")

    const path = pathParts.slice(0, -1).join("/")
    const domain = url.hostname === "gitlab.com" ? "" : `${url.hostname}/`

    return {
      type: "gitlab",
      source: `gitlab://${domain}${ownerRepo}:${branch}/${path}`,
    }
  }

  // Gitea (hosted or self-hosted)
  if (url.pathname.includes("/raw/branch/")) {
    const [ownerRepo, , , branch, ...pathParts] = url.pathname.replace(/^\/+/, "").split("/")

    const path = pathParts.slice(0, -1).join("/")
    const domain = url.hostname === "gitea.com" ? "" : `${url.hostname}/`

    return {
      type: "gitea",
      source: `gitea://${domain}${ownerRepo}:${branch}/${path}`,
    }
  }

  throw new Error(`Unsupported raw repo URL: ${rawUrl}`)
}
