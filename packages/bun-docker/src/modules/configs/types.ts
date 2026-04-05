export type ListConfigsOptions = {
  filters: {
    id: string[]
    /** label=<key> or label=<key>=value */
    label: string[]
    name: string[]
    names: string[]
  }
}

export type Config = {
  Name: string
  Labels: Record<string, string>
  Data: string
  Templating?: Record<string, Record<string, string>>
}

export type ConfigResponse = {
  ID: string
  Version: {
    Index: number
  }
  CreatedAt: string
  UpdatedAt: string
  Spec: Config
}
