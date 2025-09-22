export type PluginTable = {
  id: number
  name: string,
  version: string,
  type: "component" | "backend" | "multi"
  component?: Blob
  backend?: Blob
}
