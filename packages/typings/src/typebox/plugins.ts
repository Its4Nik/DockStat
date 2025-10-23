import type { ColumnDefinition } from "@dockstat/sqlite-wrapper";
import { t } from "elysia";

export const PluginData = t.Object({
  name: t.String(),
  description: t.String(),
  version: t.String(),
  repository: t.String(),
  manifest: t.String(),
  author: t.Object({
    name: t.String(),
    website: t.Nullable(t.String({ format: "uri" })),
    license: t.String({ default: "MIT" }),
    email: t.Nullable(t.String({ format: "email" }))
  })
})

export const PluginContext = t.Object({
  containerId: t.Nullable(t.String()),
  stackId: t.Nullable(t.Number()),
  table: t.Object({
    columns: t.Record(t.String(), t.UnionEnum(["TEXT", "JSON", "NUMBER", "BOOLEAN"])),
    name: t.String(),
  })
})

export type ContainerHooksContext = {
  containerId: string,
  hostId: number,
  stackId?: number
}

export type ContainerHook = (ctx: ContainerHooksContext) => unknown

export type StackHookContext = {
  stackId: number
  containerIDs: string[]
  stackHandler: (action: "restart" | "start" | "down") => void
  moveStack: (fromDockNode: number, toDockNode: string) => void
  backupStack: () => Bun.FileBlob
}

export type StackHook = (ctx: StackHookContext) => unknown

export type PluginActions = {
  createTable?: (name: string, columns: Record<string, ColumnDefinition>) => boolean
  createRoute?: (path: string, method: "POST" | "GET", actions: string[]) => boolean
  createWS?: (path: string, onMessage: string[], actions: string[]) => boolean

  onContainerStop?: ContainerHook
  onContainerStart?: ContainerHook
  onContainerPause?: ContainerHook
  onContainerExit?: ContainerHook
  onContainerRestart?: ContainerHook

  onStackError?: StackHook
  onStackDown?: StackHook
  onStackStart?: StackHook
  onStackDeploy?: StackHook
  onStackDelete?: StackHook
  onStackMove?: StackHook
  onStackBackup?: StackHook
}
