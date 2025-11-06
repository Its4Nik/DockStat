import type { RepoType, StaticPluginMeta } from "@dockstat/typings/types"
import { ExtensionBrowser } from "@dockstat/ui"
import type { Route } from "./+types/dockstore"
import { ExtensionLoader } from "@ServerLoaders/extensions"
import { ExtensionActions } from "@ServerActions/extensions"

export const action = ExtensionActions
export const loader = ExtensionLoader

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const serverLoaderData = await serverLoader()
  const plugins: Record<string, StaticPluginMeta> = {}

  for (const [repoName, repoManifest] of Object.entries(serverLoaderData.repoManifests)) {
    const pluginNames = repoManifest.data.plugins

    for (const plugin of pluginNames) {
      const pluginData = await (await fetch(`/api/extensions/plugin/manifest/${plugin}`, {
        body: JSON.stringify(
          {
            repoSource: repoManifest.repoSource,
            repoType: repoManifest.type
          }
        ),
        headers: {
          'Content-Type': 'application/json'
        },
        method: "POST"
      })).json()

      plugins[plugin] = pluginData
    }
  }

  return { ...serverLoaderData, pluginMetas: plugins }
}
clientLoader.hydrate = true as const;


export default async function Extensions({ loaderData }: Route.ComponentProps) {
  const data = loaderData

  return (
    <ExtensionBrowser
      allowUntrustedRepo={data.allow_untrusted_repo}
      installedPlugins={data.installedPlugins}
      repos={data.repos}
    />
  )
}
