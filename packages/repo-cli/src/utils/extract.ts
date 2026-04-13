// cli/utils/extract.ts
import type { PluginMetaType } from "@dockstat/typings/types"

export function extractMeta(plugin: Record<string, unknown>): PluginMetaType {
  return {
    author: plugin.author,
    description: plugin.description,
    manifest: plugin.manifest,
    name: plugin.name,
    repository: plugin.repository,
    repoType: plugin.repoType,
    tags: plugin.tags,
    version: plugin.version,
  } as PluginMetaType
}
