import { useLoaderData } from "react-router"
import { api } from "~/.server/treaty"

export async function loader() {
  const { data: installedPlugins } = await api.plugins.all.get()
  const { data: config } = await api.db["dockstat-config"].get()
  const repos = config?.config.registered_repos || []
  return { installedPlugins, repos }
}

export default function DockStore() {
  const data = useLoaderData<typeof loader>()
  return <div>{JSON.stringify(data)}</div>
}
