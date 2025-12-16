import type {
  DockStatConfigTable,
  Repo,
  TableMetaData,
  UpdateDockStatConfigTableResponse,
} from "./db"
import type { RepoManifest } from "./dockstore"
import type { DBPlugin, DBPluginShemaT, Plugin, WrappedPluginMeta } from "./plugins"

export type {
  buildMessageFromProxyRes,
  ProxyEventMessage,
} from "../docker-client-worker"
export type { DockerStreamManagerProxy } from "../docker-monitoring-manager"

type DockStatConfigTableType = typeof DockStatConfigTable.static
type RepoType = typeof Repo.static
type TableMetaDataType = typeof TableMetaData.static
type UpdateDockStatConfigTableResponseType = typeof UpdateDockStatConfigTableResponse.static
type PluginMetaType = typeof WrappedPluginMeta.static
type RepoManifestType = typeof RepoManifest.static

export type {
  DockStatConfigTableType,
  RepoType,
  TableMetaDataType,
  UpdateDockStatConfigTableResponseType,
  DBPlugin,
  Plugin,
  DBPluginShemaT,
  PluginMetaType,
  RepoManifestType,
}
