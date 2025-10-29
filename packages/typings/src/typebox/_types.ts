import type { DockStatConfigTable, Repo, TableMetaData, UpdateDockStatConfigTableResponse } from "./db";
import type { DBPlugin, Plugin, StaticPluginMeta } from "./plugins"

type DockStatConfigTableType = typeof DockStatConfigTable.static;
type RepoType = typeof Repo.static;
type TableMetaDataType = typeof TableMetaData.static;
type UpdateDockStatConfigTableResponseType =
  typeof UpdateDockStatConfigTableResponse.static;

export type {
  DockStatConfigTableType,
  RepoType,
  TableMetaDataType,
  UpdateDockStatConfigTableResponseType,
  DBPlugin,
  Plugin,
  StaticPluginMeta
}
