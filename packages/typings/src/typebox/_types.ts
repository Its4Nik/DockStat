import type {
	DockStatConfigTable,
	Repo,
	TableMetaData,
	UpdateDockStatConfigTableResponse,
} from './db'
import type {
	DBPlugin,
	Plugin,
	WrappedPluginMeta,
	DBPluginShemaT,
} from './plugins'
import { RepoManifest } from './dockstore'

type DockStatConfigTableType = typeof DockStatConfigTable.static
type RepoType = typeof Repo.static
type TableMetaDataType = typeof TableMetaData.static
type UpdateDockStatConfigTableResponseType =
	typeof UpdateDockStatConfigTableResponse.static
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
