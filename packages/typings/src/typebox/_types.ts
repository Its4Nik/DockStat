import type {
  DockStatConfigTable,
  Repo,
  TableMetaData,
  UpdateDockStatConfigTableResponse,
} from "./db"
import type { RepoManifest } from "./dockstore"
import type { DBPlugin, DBPluginShemaT, Plugin, WrappedPluginMeta } from "./plugins"

export type { buildMessageFromProxyRes, ProxyEventMessage } from "../docker-client-worker"
export type { DockerStreamManagerProxy } from "../docker-monitoring-manager"

/**
 * Exported TypeBox-derived static types.
 * These are exported as explicit `export type` aliases to make imports more ergonomic
 * and to avoid re-export blocks that mix runtime and type-only exports.
 */
export type DockStatConfigTableType = typeof DockStatConfigTable.static
export type RepoType = typeof Repo.static
export type TableMetaDataType = typeof TableMetaData.static
export type UpdateDockStatConfigTableResponseType = typeof UpdateDockStatConfigTableResponse.static
export type PluginMetaType = typeof WrappedPluginMeta.static
export type RepoManifestType = typeof RepoManifest.static

// Export DB/plugin types used across the monorepo
export type { DBPlugin, Plugin, DBPluginShemaT }
