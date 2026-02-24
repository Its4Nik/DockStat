export type StackEnv = Record<string, string | boolean | number | undefined>

export type EnvValue = string | number | boolean | null | undefined
export type EnvMap = Record<string, EnvValue>

export interface Stack extends Record<string, unknown> {
  id: number
  name: string
  version: string
  repository: string
  stack: string
  yaml: string
  env: EnvMap
}

export interface CreateStackInput {
  name: string
  yaml: string
  repository: string
  repoName: string
  version: string
  env: EnvMap
}

export interface UpdateStackInput {
  version?: string
  yaml?: string
  env?: EnvMap
}

export interface DeleteStackOptions {
  removeFiles?: boolean
}
