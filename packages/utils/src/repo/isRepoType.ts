import type { RepoType } from "@dockstat/typings/types"

const REPO_TYPES = ["gitea", "github", "gitlab", "http", "local"] as const

export function isRepoType(str: string): str is RepoType["type"] {
  return REPO_TYPES.includes(str as RepoType["type"])
}
