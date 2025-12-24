import type {
  CreateRepo,
  DockStatConfigTable,
  PluginHashes,
  Repo,
  RepoResponse,
  TableMetaData,
  UpdateDockStatConfigTableResponse,
  UpdateRepo,
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
type CreateRepoType = typeof CreateRepo.static
type UpdateRepoType = typeof UpdateRepo.static
type RepoResponseType = typeof RepoResponse.static
type PluginHashesType = typeof PluginHashes.static
type TableMetaDataType = typeof TableMetaData.static
type UpdateDockStatConfigTableResponseType = typeof UpdateDockStatConfigTableResponse.static
type PluginMetaType = typeof WrappedPluginMeta.static
type RepoManifestType = typeof RepoManifest.static

export type {
  CreateRepoType,
  DockStatConfigTableType,
  DBPlugin,
  DBPluginShemaT,
  Plugin,
  PluginHashesType,
  PluginMetaType,
  RepoManifestType,
  RepoResponseType,
  RepoType,
  TableMetaDataType,
  UpdateDockStatConfigTableResponseType,
  UpdateRepoType,
}
