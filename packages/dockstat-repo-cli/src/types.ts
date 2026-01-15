// cli/types.ts
import type { CreateRepoType, PluginMetaType } from "@dockstat/typings/types"

export interface Opts extends Omit<CreateRepoType, "source"> {
  root: string
  themes: { dir: string }
  plugins: { dir: string; bundle: string }
  stacks: { dir: string }
}

export interface RepoFile {
  config: Omit<Opts, "root">
  content: {
    plugins: PluginMetaType[]
    themes: unknown[]
    stacks: unknown[]
  }
}

export interface BuildResult {
  name: string
  success: boolean
  meta?: PluginMetaType
  error?: string
}

// cli/types.ts (add or update)
export interface BadgeOptions {
  label: string
  message: string
  color: string
  labelColor?: string
  style?: "flat" | "flat-square"
  icon?: string
}
