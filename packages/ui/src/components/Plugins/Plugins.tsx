import type { DBPluginShemaT } from "@dockstat/typings/types"
import { Card, CardBody, CardHeader } from "../Card/Card"
import { Divider } from "../Divider/Divider"
import { PluginsOverviewCard } from "./Overview"
import { PluginCard } from "./Plugin"
import { RepositoriesList } from "./RepoList"

interface PluginStatus {
  installed_plugins: {
    count: number
    data: DBPluginShemaT[]
  }
  repos: string[]
  loaded_plugins: (DBPluginShemaT | undefined)[]
}

interface PluginsPageProps {
  installedPlugins: DBPluginShemaT[]
  status: PluginStatus
}

export function PluginsPage({ installedPlugins = [], status }: PluginsPageProps) {
  const pluginCount = status?.installed_plugins?.count || 0
  const repos = status?.repos || []
  const loadedPlugins = status?.loaded_plugins || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <PluginsOverviewCard
          pluginCount={pluginCount}
          repoCount={repos.length}
          loadedPluginsCount={loadedPlugins.length}
        />

        <RepositoriesList repositories={repos} />
      </div>
      <Divider className="my-4" variant="dotted" />
      <Card>
        <CardHeader className="text-xl font-semibold">Installed Plugins</CardHeader>
        <CardBody>
          {installedPlugins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No plugins installed yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {installedPlugins.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
