import type {
  DockStatConfigTable,
  Repo,
  TableMetaData,
  UpdateDockStatConfigTableResponse,
} from "./db";

export type {
  BackendAction,
  BackendContext,
  ContainerHook,
  ContainerHooksContext,
  HostHook,
  HostHookContext,
  PluginBase,
  PluginContextType,
  PluginDataType,
  PluginPermissions,
  StackHook,
  StackHookContext,
  TableSchemaType,
} from "./plugins";

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
};
