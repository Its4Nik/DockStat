import { ServerAPI } from "~/.server";

export default function ExtensionBrowserLoader() {
  const [installedPlugins] = await Promise.all([
    ServerAPI.plugins.all.get()

  ])

}
