import type { RepoType } from "@dockstat/typings/types";
import { getGitHubRepoManifest, getGitHubPluginManifest } from "./github";
import { logger } from "..";

export async function getRemotePluginManifest(repoType: RepoType["type"], repoSource: string, pluginName: string) {
  logger.debug(`Getting Remote Plugin Manifest - repoType=${repoType} repoSource=${repoSource} pluginName=${pluginName}`)
  if (repoType === "github")
    return await getGitHubPluginManifest(repoSource, pluginName)

  return new Response(`Unknown Repository Type: ${repoType}`, { status: 402 })
}

export async function getRepoManifest(repoType: RepoType["type"], repoSource: string) {
  logger.debug(`Getting remote Repo Manifest - repoType=${repoType} repoSource=${repoSource}`)
  if (repoType === "github")
    return getGitHubRepoManifest(repoSource)
}
