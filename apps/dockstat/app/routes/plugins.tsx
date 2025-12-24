import { Plugins } from "!L+A/plugins"
import { Divider, Slides } from "@dockstat/ui"
import { useLoaderData } from "react-router"
import {
  AddRepositoryForm,
  PluginStatusBar,
  PluginsList,
  RepositoriesList,
} from "~/components/plugins"
import type { LocalVerificationStatus, PluginsLoaderData } from "~/components/plugins/types"

export const loader = Plugins.loader
export const action = Plugins.action

export default function PluginsPage() {
  const data = useLoaderData<typeof loader>() as PluginsLoaderData

  const {
    plugins = [],
    loadedPluginIds = [],
    repositories = [],
    verifications = {},
    stats = {
      totalPlugins: 0,
      loadedPlugins: 0,
      verifiedPlugins: 0,
      safePlugins: 0,
      unsafePlugins: 0,
      totalRepositories: 0,
    },
  } = data ?? {}

  // Convert verifications object to Map for the PluginsList component
  const verificationsMap = new Map<number, LocalVerificationStatus>(
    Object.entries(verifications).map(([key, value]) => [Number(key), value])
  )

  // Calculate plugin count by repository
  const pluginCountByRepo: Record<string, number> = {}
  for (const plugin of plugins) {
    const verification = verifications[plugin.id]
    const repoName = verification?.repository || plugin.repository || "Unknown"
    pluginCountByRepo[repoName] = (pluginCountByRepo[repoName] || 0) + 1
  }

  return (
    <div className="w-[95vw] mx-auto py-6 space-y-6">
      {/* Stats Row */}
      <PluginStatusBar
        totalPlugins={stats.totalPlugins}
        loadedPlugins={stats.loadedPlugins}
        verifiedPlugins={stats.verifiedPlugins}
        safePlugins={stats.safePlugins}
        unsafePlugins={stats.unsafePlugins}
        totalRepositories={stats.totalRepositories}
      />

      <Divider />

      {/* Action Slides */}
      <Slides
        connected={true}
        buttonPosition="right"
        className="w-full"
        header="Manage"
        hideable={true}
      >
        {{
          "+ Add Repository": <AddRepositoryForm />,
        }}
      </Slides>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plugins List */}
        <PluginsList
          plugins={plugins}
          loadedPluginIds={loadedPluginIds}
          verifications={verificationsMap}
        />

        {/* Repositories List */}
        <RepositoriesList repositories={repositories} pluginCountByRepo={pluginCountByRepo} />
      </div>
    </div>
  )
}
