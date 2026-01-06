import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"
import { t } from "elysia"
import type { EVENTS, PluginActions, PluginConfig } from ".."
import { Repo } from "./db"

/**
 * name: The Plugins name
 * description: A short description of what the plugin does
 * version: Semver (example: v1.0.1,  2.12.4)
 * repository: The path to the Repository Manifest (can be in the custom formats)
 * manifest: Path to the Plugin Manifest file (can be in the same custom formats)
 * author:
 *  name: Your Alias
 *  website: (Nullable) Your Website
 *  email: (Nullable) Your E-Mail
 * tags: Tags which should be shown in DockStore
 */
export const PluginMeta = {
  name: t.String(),
  description: t.String(),
  version: t.String(),
  repository: t.String(),
  repoType: Repo.properties.type,
  manifest: t.String(),
  author: t.Object({
    name: t.String(),
    website: t.Optional(t.String({ format: "uri" })),
    license: t.String({ default: "MIT" }),
    email: t.Optional(t.String({ format: "email" })),
  }),
  tags: t.Optional(t.Array(t.String())),
}

export const WrappedPluginMeta = t.Object(PluginMeta)

type WrappedPluginMetaType = typeof WrappedPluginMeta.static

export const DBPluginShema = t.Object({
  id: t.Nullable(t.Number()),
  plugin: t.String(),
  // verificationApi: t.String(),
  ...PluginMeta,
})

export type DBPluginShemaT = typeof DBPluginShema.static

export interface DBPlugin<Columns = Record<string, ColumnDefinition>>
  extends WrappedPluginMetaType,
    Record<string, unknown> {
  id?: number
  table?: {
    name: string
    columns: Columns
    jsonColumns: (keyof Columns)[]
  }
  plugin: string
}

export interface Plugin<
  T extends Record<string, unknown> = Record<string, unknown>,
  K extends PluginActions<T> = PluginActions<T>,
> extends WrappedPluginMetaType,
    Omit<DBPlugin, "plugin"> {
  config?: PluginConfig<T, K>
  events?: Partial<EVENTS<T>>
  init?: () => void
}

export const PluginStatusRepsonse = t.Object({
  installed_plugins: t.Number(),
  types: t.Object({
    gitlab: t.Array(DBPluginShema),
    github: t.Array(DBPluginShema),
    http: t.Array(DBPluginShema),
  }),
  repos: t.Array(t.String()),
  loaded_plugins: t.Array(DBPluginShema),
})
