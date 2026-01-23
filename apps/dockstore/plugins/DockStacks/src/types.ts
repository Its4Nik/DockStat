interface StackConfig extends Record<string, unknown> {
  id: number
  name: string
  hostId: number
  clientId: number
  rootDir: string
  yaml: string
  user: string
  port: number
  private_key?: string
  password?: string
}

export type { StackConfig }
