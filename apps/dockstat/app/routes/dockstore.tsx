import type { DBPluginShemaT, RepoType } from "@dockstat/typings/types"
import { DockStore } from "@dockstat/ui"
import { useLoaderData } from "react-router"
import { api } from "~/.server/treaty"
import type { Route } from "./+types/dockstore"

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData()
  let pluginManifest: DBPluginShemaT = JSON.parse(formData.get("pluginManifest")?.toString() || "{}")
  let repoId = formData.get("repoId")?.toString()
  let action = formData.get("action")

  if (action === "install") {
    return await api.plugins.install.post(pluginManifest)
  } else if (action === "uninstall") {
    if (!repoId) { return new Response("No Repository ID received", { status: 400 }) }

    return await api.plugins.delete.post(Number(repoId))
  }
  return new Response("Invalid action", { status: 400 })
}

export async function loader() {
  const { data: pluginData } = await api.plugins.all.get()
  const { data: config } = await api.db["dockstat-config"].get()
  const repos = config?.config.registered_repos || []
  const allow_untrusted_repo = Boolean(config?.config.allow_untrusted_repo)

  const installedPlugins = pluginData || []

  const pDat: {
    installedPlugins: DBPluginShemaT[]
    repos: RepoType[]
    allow_untrusted_repo: boolean
  } = { installedPlugins, repos, allow_untrusted_repo }

  return pDat
}

export default function DockStorePage() {
  const data = useLoaderData<typeof loader>()

  return (
    <DockStore
      allowUntrustedRepo={data.allow_untrusted_repo}
      installedPlugins={data.installedPlugins}
      repos={data.repos}
    />
  )
}
