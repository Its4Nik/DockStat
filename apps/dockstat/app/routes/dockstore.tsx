import type { RepoType } from "@dockstat/typings/types"
import { ExtensionBrowser } from "@dockstat/ui"
import { useLoaderData } from "react-router"
import type { Route } from "./+types/dockstore"
import { ExtensionLoader } from "@ServerLoaders/extensions"
import { ExtensionActions } from "@ServerActions/extensions"

export const action = ExtensionActions
export const loader = ExtensionLoader

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const serverLoaderData = await serverLoader()
  const t = {}

  for (const repo of serverLoaderData.repos) {
    const [] = await Promise.all([
      fetch("/api/")
    ])
  }

  return { ...serverLoaderData }
}
clientLoader.hydrate = true as const;


export default async function Extensions({ }: Route.ComponentProps) {
  const data = useLoaderData<typeof loader>()

  return (
    <ExtensionBrowser
      allowUntrustedRepo={data.allow_untrusted_repo}
      installedPlugins={data.installedPlugins}
      repos={data.repos}
    />
  )
}
