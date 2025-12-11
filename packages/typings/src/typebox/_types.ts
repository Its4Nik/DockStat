import type {
  DockStatConfigTable,
  Repo,
  TableMetaData,
  UpdateDockStatConfigTableResponse,
} from "./db"
import type { DBPlugin, Plugin, WrappedPluginMeta, DBPluginShemaT } from "./plugins"
import type { RepoManifest } from "./dockstore"

export type { DockerStreamManagerProxy } from "../docker-monitoring-manager"
export type {
  ProxyEventMessage,
  buildMessageFromProxyRes,
} from "../docker-client-worker"

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
