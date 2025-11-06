import type { DBPluginShemaT, RepoType } from "@dockstat/typings/types"
import { Card, CardBody, CardHeader } from "../Card/Card";
import { Badge } from "../Badge/Badge";
import { Repo } from "./Repo";

export interface ExtensionBrowserProps {
  repos: RepoType[];
  installedPlugins: DBPluginShemaT[]
  allowUntrustedRepo: boolean
}

export function ExtensionBrowser({ repos, allowUntrustedRepo, installedPlugins }: ExtensionBrowserProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="justify-between flex">
          <p className="font-extrabold text-2xl">
            Extensions
          </p>

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
            <Repo repo={repo} key={repo.name} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
