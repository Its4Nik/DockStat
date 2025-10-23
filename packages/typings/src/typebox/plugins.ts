import type { ColumnDefinition, QueryBuilder } from "@dockstat/sqlite-wrapper";
import { t } from "elysia";

/**
 * Small enum for allowed column types (runtime validator).
 */
const ColumnType = t.UnionEnum(["TEXT", "JSON", "NUMBER", "BOOLEAN"] as const);

/**
 * Plugin metadata validated at runtime.
 */
export const PluginData = t.Object({
  name: t.String(),
  description: t.String(),
  version: t.String(),
  repository: t.Object({
    type: t.UnionEnum(["local", "github", "gitlab"]),
    path: t.String(),
    branch: t.Optional(t.String()),
  }),
  manifest: t.String(),
  author: t.Object({
    name: t.String(),
    website: t.Nullable(t.String({ format: "uri" })),
    license: t.String({ default: "MIT" }),
    email: t.Nullable(t.String({ format: "email" })),
  }),
  tags: t.Optional(t.Array(t.String())),
});

/**
 * Table schema/runtime validator for a plugin-provided table.
 * - columns: record of columnName -> ColumnType
 * - primaryKey: optional column name
 * - indexes: optional array of column names to index
 */
export const TableSchema = t.Object({
  name: t.String(),
  columns: t.Record(t.String(), ColumnType),
});

/**
 * Plugin context at runtime (validated).
 * I expanded it to include host info and DB name for clarity.
 */
export const PluginContext = t.Object({
  containerId: t.Nullable(t.String()),
  containerName: t.Nullable(t.String()),
  hostId: t.Nullable(t.Number()),
  stackId: t.Nullable(t.Number()),
  dbName: t.Nullable(t.String()),
  table: t.Nullable(TableSchema),
  environment: t.Optional(t.Record(t.String(), t.String())), // env vars given to plugin
});

/* ---------------------------
   Types for usage in code
   --------------------------- */

/** Container hook context provided to container lifecycle hooks. */
export type ContainerHooksContext = {
  containerId: string;
  hostId: number;
  stackId?: number;
  containerName?: string;
  // optional metadata the runtime may pass
  metadata?: Record<string, unknown>;
};

/** Signature for a container lifecycle hook (may be async). */
export type ContainerHook = (
  ctx: ContainerHooksContext
) => Promise<unknown> | unknown;

/** Stack hook context */
export type StackHookContext = {
  stackId: number;
  containerIDs: string[];
  /**
   * Handler for simple stack actions. Return/resolve when done.
   * Allowed actions: 'restart' | 'start' | 'down'
   */
  stackHandler: (action: "restart" | "start" | "down") => Promise<void> | void;

  /**
   * Move a stack from one dock node to another.
   * fromDockNode: numeric id of the source node
   * toDockNode: numeric id of the destination node
   */
  moveStack: (fromDockNode: number, toDockNode: number) => Promise<void> | void;

  /**
   * Request a backup of the stack. Return a Blob/File-like object or a Promise resolving to it.
   * Using `Blob` here keeps it environment-agnostic. Runtimes can use Bun.FileBlob if needed.
   */
  backupStack: () => Promise<Blob | File> | Blob | File;
};

/** Signature for a stack lifecycle hook. */
export type StackHook = (ctx: StackHookContext) => Promise<unknown> | unknown;

export type HostHookContext = {
  hostId: string;
  hostConfig: unknown;
};

export type HostHook = (ctx: HostHookContext) => Promise<unknown> | unknown;

/** Minimal backend context that actions may receive. Extend as needed. */
export type BackendContext<T extends Record<string, unknown>> = {
  pluginName: string;
  pluginData?: PluginDataType;
  ctx: PluginContextType;
  logger: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug?: (...args: unknown[]) => void;
  };
  // lightweight DB access stub (the runtime should provide real methods)
  db?: QueryBuilder<T>;
  // other host-provided utilities
  [key: string]: unknown;
};

/** Generic backend action signature. */
export type BackendAction<T extends Record<string, unknown>> = (
  ctx: BackendContext<T>
) => Promise<unknown> | unknown;

/** Permissions shape for a plugin */
export type PluginPermissions = {
  allowedTables?: string[]; // which DB tables the plugin can access (empty => none / or "*" for all)
  allowedDbFunctions?: Array<
    "select" | "insert" | "update" | "delete" | "create-table"
  >;
  protectedRoutes?: string[]; // Routes, that are not alloweded access by other Plugins
  /* 
    Define extarnal APIs here, if none are defined then no external calling will be available.
    allowedExtarnalDomains: [
      {
        path: "*google.com/*",
        methods: ["GET"],
        https: true
      },
      {
        path: "https://github.com/*",
        methods: ["GET", "POST"],
        https: true,
      },
      {
        path: "*148.159.32.58/*",
        methods: ["*"],
        https: false
      }
    ]
  */
  allowedExtarnalDomains?: [
    {
      path: string;
      methods: ["GET" | "POST" | "PUT" | "PATCH" | "*"];
      https: boolean;
    },
  ];
};

/**
 * The primary PluginActions interface.
 *
 * TColumns parameter allows typing createTable's columns parameter; default is generic
 * ColumnDefinition record. If a plugin has a precise columns type, pass it in.
 */
export interface PluginBase<
  TColumns extends Record<string, ColumnDefinition> = Record<
    string,
    ColumnDefinition
  >,
> {
  // Runtime actions the plugin can call to ask the host to create things
  createTable?: (
    name: string,
    columns: Record<keyof TColumns & string, ColumnDefinition>
  ) => Promise<boolean> | boolean;
  createRoutes?: (
    routes: [
      {
        path: string;
        method: "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
        actions: string[];
      },
    ],
    // Elysia { t }
    guard: Record<string, (...args: string[]) => Promise<unknown> | unknown>
  ) => Promise<boolean> | boolean;
  createWS?: (
    path: string,
    onMessageActions: string[],
    onConnectionOpen: string[],
    onConnectionClosed: string[]
  ) => Promise<boolean> | boolean;

  // Required permissions for this plugin to operate
  neededPermissions: PluginPermissions;

  // Arbitrary custom actions the plugin exposes (name -> handler)
  customActions?: Record<string, BackendAction<TColumns>>;

  // Lifecycle hooks grouped for convenience:
  onContainerStop?: ContainerHook;
  onContainerStart?: ContainerHook;
  onContainerPause?: ContainerHook;
  onContainerExit?: ContainerHook;
  onContainerRestart?: ContainerHook;

  onStackError?: StackHook;
  onStackDown?: StackHook;
  onStackStart?: StackHook;
  onStackDeploy?: StackHook;
  onStackDelete?: StackHook;
  onStackMove?: StackHook;
  onStackBackup?: StackHook;

  onHostDown?: HostHook;
  onHostBackOnline?: HostHook;
  onHostAdded?: HostHook;
  onHostRemoved?: HostHook;
}

/* ---------------------------
   Convenience exports/types
   --------------------------- */

export type PluginDataType = typeof PluginData.static;
export type TableSchemaType = typeof TableSchema.static;
export type PluginContextType = typeof PluginContext.static;
