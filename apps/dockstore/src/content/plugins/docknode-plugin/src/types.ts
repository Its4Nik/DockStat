export type DockNodePluginSupportedHandlers = "dockstack"

export type DockNodePluginTable = {
  id: number
  name: string
  host: {
    adress: string // Either IP (v4 or v6) adress or DNS
    port: number
    proto: "http" | "https"
  }
  certData: unknown | null
  handlers: DockNodePluginSupportedHandlers[]
  authenticationKey: unknown
}
