import { ExtensionBrowser } from "@dockstat/ui"

export default function ExtensionsB() {
  return <ExtensionBrowser
  allowUntrustedRepo={true}
  installedPlugins={}
  repos={}
  manifests={}
  />
}
