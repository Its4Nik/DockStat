// cli/utils/extract.ts
import type { PluginMetaType } from "@dockstat/typings/types"

export function extractMeta(plugin: Record<string, unknown>): PluginMetaType {
  return {
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    repository: plugin.repository,
    repoType: plugin.repoType,
    manifest: plugin.manifest,
    author: plugin.author,
    tags: plugin.tags,
  } as PluginMetaType
}
