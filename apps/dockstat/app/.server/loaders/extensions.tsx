import type { DBPluginShemaT, RepoType } from "@dockstat/typings/types"
import { api } from "../treaty"
import { logger } from "."

export async function ExtensionLoader() {
  logger.debug("Getting all Plugins and DockStat Config fom DB")
  const [treatyResPlugins, treatyResDockstatConfig] = await Promise.all([
    api.plugins.all.get(),
    api.db["dockstat-config"].get()
  ])

  const repos = treatyResDockstatConfig.data?.config.registered_repos || []
  const allow_untrusted_repo = Boolean(treatyResDockstatConfig.data?.config.allow_untrusted_repo) === true

  logger.debug(`Allow Untrusted Repos: ${allow_untrusted_repo}`)
  logger.debug(`Found repos: ${JSON.stringify(repos)}`)

  const installedPlugins = treatyResPlugins.data || []





  const pDat: {
    installedPlugins: DBPluginShemaT[]
    repos: RepoType[]
    allow_untrusted_repo: boolean
  } = { installedPlugins, repos, allow_untrusted_repo }

  return pDat
}
