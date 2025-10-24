import type { ColumnDefinition } from "@dockstat/sqlite-wrapper";
import { type AnyElysia, t } from "elysia";
import type { DockerClientEvents } from "../docker-client";

export const PluginMeta = t.Object({
  name: t.String(),
  description: t.String(),
  version: t.String(),
  repository: t.String(),
  type: t.UnionEnum(["http", "github", "gitlab"]),
  branch: t.Nullable(t.String(), { default: null }),
  manifest: t.String(),
  author: t.Object({
    name: t.String(),
    website: t.Nullable(t.String({ format: "uri" })),
    license: t.String({ default: "MIT" }),
    email: t.Nullable(t.String({ format: "email" }))
  })
})

export type StaticPluginMeta = typeof PluginMeta.static

export interface Plugin<Columns = Record<string, ColumnDefinition>> extends StaticPluginMeta, Record<string, unknown> {
  table?: { name: string, columns: Columns, jsonColumns: (keyof Columns)[] }
  routes?: AnyElysia
  events?: Partial<DockerClientEvents>
}
