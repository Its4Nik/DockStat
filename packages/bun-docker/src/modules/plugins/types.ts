export type PluginsFilter = {
  capability: string[]
  enabled: boolean[]
}

export type PluginDevice = {
  Name: string
  Description: string
  Settable: string[]
  Path: string
}

export type PluginMount = {
  Name: string
  Description: string
  Settable: string[]
  Source: string
  Destination: string
  Type: string
  Options: string[]
}

export type PluginConfig = {
  Id: string
  Name: string
  Enabled: boolean
  Settings: {
    Mounts: Array<PluginMount>
    Env: string[]
    Args: string[]
    Devices: Array<PluginDevice>
  }
  PluginReference: string
  Config: {
    Description: string
    Documentation: string
    Interface: Array<{
      Types: string[]
      Socket: string
      ProtocolScheme: "" | "moby.plugins.http/v1"
    }>
    Entrypoint: string[]
    WorkDir: string
    User: {
      UID: number
      GID: number
    }
    Network: {
      Type: string
    }
    Linux: {
      Capabilities: string[]
      AllowAllDevices: boolean
      Devices: Array<PluginDevice>
    }
    PropagatedMount: string
    IpcHost: string
    PidHost: string
    Mounts: Array<PluginMount>
    Env: Array<{
      Name: string
      Description: string
      Settable: string[]
      Value: string
    }>
    Args: Array<{ Name: string; Description: string; Settable: string[]; Value: string[] }>
    rootfs: {
      type: string
      diff_ids: string[]
    }
  }
}

export type PluginPrivilege = {
  Name: string
  Description: string
  Value: string[]
}

export type ListPluginsOptions = {
  filters?: PluginsFilter
}

export type PullPluginOptions = {
  remote: string
  name?: string
  privileges?: PluginPrivilege[]
}

export type CreatePluginOptions = {
  name: string
  path: string
}

export type RemovePluginOptions = {
  force?: boolean
}

export type EnablePluginOptions = {
  timeout?: number
}

export type DisablePluginOptions = {
  timeout?: number
}

export type UpgradePluginOptions = {
  remote: string
  privileges?: PluginPrivilege[]
}

export type SetPluginOptions = {
  settings: Array<PluginMount | PluginDevice | string[]>
}
