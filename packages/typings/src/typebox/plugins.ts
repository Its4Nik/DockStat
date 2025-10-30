import type { ColumnDefinition } from "@dockstat/sqlite-wrapper";
import { type AnyElysia, t } from "elysia";
import type { DockerClientEvents } from "../docker-client";

export const PluginMeta = {
  name: t.String(),
  description: t.String(),
  version: t.String(),
  repository: t.String(),
  type: t.UnionEnum(["http", "github", "gitlab", "default"]),
  branch: t.Nullable(t.String(), { default: null }),
  manifest: t.String(),
  author: t.Object({
    name: t.String(),
    website: t.Nullable(t.String({ format: "uri" })),
    license: t.String({ default: "MIT" }),
    email: t.Nullable(t.String({ format: "email" })),
  }),
  tags: t.Optional(t.Array(t.String())),
};

const pPluginMeta = t.Object({ ...PluginMeta })

export type StaticPluginMeta = typeof pPluginMeta.static

export const DBPluginShema = t.Object({
  id: t.Nullable(t.Number()),
  table: t.Array(t.Object({
    name: t.String(),
    columns: t.Record(t.String(), t.Unknown()),
    jsonColumns: t.Array(t.String())
  })),
  plugin: t.String(),
  ...PluginMeta
})

export type DBPluginShemaT = typeof DBPluginShema.static

export interface DBPlugin<Columns = Record<string, ColumnDefinition>> extends StaticPluginMeta, Record<string, unknown> {
  id?: number;
  table?: { name: string, columns: Columns, jsonColumns: (keyof Columns)[] }
  plugin: string
}

export interface Plugin extends StaticPluginMeta, Omit<DBPlugin, "plugin"> {
  routes?: AnyElysia,
  events?: Partial<DockerClientEvents>
  init?: () => void,
}

export const PluginStatusRepsonse = t.Object({
  installed_plugins: t.Number(),
  types: t.Object({
    gitlab: t.Array(DBPluginShema),
    github: t.Array(DBPluginShema),
    http: t.Array(DBPluginShema),
  }),
  repos: t.Array(t.String()),
  loaded_plugins: t.Array(DBPluginShema)
})
