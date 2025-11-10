import type { RepoType } from "@dockstat/typings/types";
import { getGitHubRepoManifest } from "./github";
import { logger } from "..";

export async function getRepoManifest(repoType: RepoType["type"], repoSource: string) {
  logger.debug(`Getting remote Repo Manifest - repoType=${repoType} repoSource=${repoSource}`)
  if (repoType === "github")
    return getGitHubRepoManifest(repoSource)
}
