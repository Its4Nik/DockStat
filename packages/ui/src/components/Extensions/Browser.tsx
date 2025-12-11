import type { DBPluginShemaT, RepoManifestType, RepoType } from "@dockstat/typings/types"
import { Card, CardBody, CardHeader } from "../Card/Card"
import { Badge } from "../Badge/Badge"
import { Repo } from "./Repo"

export interface ExtensionBrowserProps {
  repos: RepoType[]
  installedPlugins: DBPluginShemaT[]
  allowUntrustedRepo: boolean
  manifests: Record<
    string,
    {
      data: RepoManifestType
      type: RepoType["type"]
      repoSource: string
    }
  >
}

export function ExtensionBrowser({
  repos,
  allowUntrustedRepo,
  installedPlugins,
  manifests,
}: ExtensionBrowserProps) {
  const installedPluginsRecord = Object.fromEntries(
    installedPlugins.map((p) => [p.name, { version: p.version, id: p.id }])
  ) as Record<string, { version: string; id: number }>

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="justify-between flex">
          <p className="font-extrabold text-2xl">Extensions</p>

          <div className="flex flex-row space-x-2 my-auto">
            <Badge variant="secondary">{`${installedPlugins.length} ${installedPlugins.length === 1 ? "Plugin" : "Plugins"} installed`}</Badge>
            <Badge variant="secondary">{`${repos.length} ${repos.length === 1 ? "Repository" : "Repositories"} registered`}</Badge>
            {allowUntrustedRepo && <Badge variant="error">Allowing untrusted repositories</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="flex flex-wrap">
          {repos.map((repo) => (
            <Repo
              repo={repo}
              key={repo.name}
              plugins={manifests[repo.name].data.plugins}
              installedPlugins={installedPluginsRecord}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
