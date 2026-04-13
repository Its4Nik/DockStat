import type { paths } from "../../v1.54"

export type ListPluginsRoute = paths["/plugins"]["get"]
export type PluginPrivlegesRoute = paths["/plugins/privileges"]["get"]
export type PullPluginRoute = paths["/plugins/pull"]["post"]
export type InspectPluginRoute = paths["/plugins/{name}/json"]["get"]
export type DeletePluginRoute = paths["/plugins/{name}"]["delete"]
export type EnablePluginRoute = paths["/plugins/{name}/enable"]["post"]
export type DisablePluginRoute = paths["/plugins/{name}/disable"]["post"]
export type UpgradePluginRoute = paths["/plugins/{name}/upgrade"]["post"]
export type CreatePluginRoute = paths["/plugins/create"]["post"]
//export type PushPluginRoute = paths["/plugins/{name}/push"]["post"]
export type SetPluginRoute = paths["/plugins/{name}/set"]["post"]
