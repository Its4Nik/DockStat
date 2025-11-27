import type {
	DBPluginShemaT,
	RepoManifestType,
	RepoType,
} from "@dockstat/typings/types"
import type { Route } from "@RR/routes/extensions"
import { api } from "../treaty"
import { logger } from "."

export async function ExtensionLoader({ context: _ }: Route.LoaderArgs) {
	logger.debug("Getting all Plugins and DockStat Config fom DB")
	const [treatyResPlugins, treatyResDockstatConfig] = await Promise.all([
		api.plugins.all.get(),
		api.db["dockstat-config"].get(),
	])

	const repos = treatyResDockstatConfig.data?.config.registered_repos || []
	const allow_untrusted_repo =
		Boolean(treatyResDockstatConfig.data?.config.allow_untrusted_repo) === true

	logger.debug(`Allow Untrusted Repos: ${allow_untrusted_repo}`)
	logger.debug(`Found repos: ${JSON.stringify(repos)}`)

	const installedPlugins = treatyResPlugins.data || []

	const repoManifests: Record<
		string,
		{
			data: RepoManifestType
			type: RepoType["type"]
			repoSource: string
		}
	> = {}

	for (const repo of repos) {
		repoManifests[repo.name] = {
			data: (
				await api.extensions.repo.manifest.post({
					repoSource: repo.source,
					repoType: repo.type,
				})
			).data as RepoManifestType,
			type: repo.type,
			repoSource: repo.source,
		}
	}

	const pDat: {
		installedPlugins: DBPluginShemaT[]
		repos: RepoType[]
		allow_untrusted_repo: boolean
		repoManifests: typeof repoManifests
	} = {
		installedPlugins,
		repos,
		allow_untrusted_repo,
		repoManifests,
	}

	return pDat
}
