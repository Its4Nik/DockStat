import type { RepoType } from "@dockstat/typings/types";
import { getGitHubPluginManifest } from "./github";
import { logger } from "..";

export async function getRemotePluginManifest(repoType: RepoType["type"], repoSource: string, pluginName: string) {
  logger.debug(`Getting Remote Plugin Manifest - repoType=${repoType} repoSource=${repoSource} pluginName=${pluginName}`)
  if (repoType === "github")
    return await getGitHubPluginManifest(repoSource, pluginName)

  return new Response(`Unknown Repository Type: ${repoType}`, { status: 402 })
}
