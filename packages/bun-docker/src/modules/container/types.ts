import type { paths } from "../../v1.54"

// ============================================================================
// Route Type Aliases
// ============================================================================

export type ContainerListRoute = paths["/containers/json"]["get"]
export type ContainerCreateRoute = paths["/containers/create"]["post"]
export type ContainerInspectRoute = paths["/containers/{id}/json"]["get"]
export type ContainerStartRoute = paths["/containers/{id}/start"]["post"]
export type ContainerStopRoute = paths["/containers/{id}/stop"]["post"]
export type ContainerRestartRoute = paths["/containers/{id}/restart"]["post"]
export type ContainerKillRoute = paths["/containers/{id}/kill"]["post"]
export type ContainerDeleteRoute = paths["/containers/{id}"]["delete"]
export type ContainerRenameRoute = paths["/containers/{id}/rename"]["post"]
export type ContainerPauseRoute = paths["/containers/{id}/pause"]["post"]
export type ContainerUnpauseRoute = paths["/containers/{id}/unpause"]["post"]
export type ContainerWaitRoute = paths["/containers/{id}/wait"]["post"]
export type ContainerTopRoute = paths["/containers/{id}/top"]["get"]
export type ContainerLogsRoute = paths["/containers/{id}/logs"]["get"]
export type ContainerStatsRoute = paths["/containers/{id}/stats"]["get"]
export type ContainerChangesRoute = paths["/containers/{id}/changes"]["get"]
export type ContainerExportRoute = paths["/containers/{id}/export"]["get"]
export type ContainerUpdateRoute = paths["/containers/{id}/update"]["post"]
export type ContainerResizeRoute = paths["/containers/{id}/resize"]["post"]
export type ContainerAttachRoute = paths["/containers/{id}/attach"]["post"]
export type ContainerArchiveGetRoute = paths["/containers/{id}/archive"]["get"]
export type ContainerArchiveHeadRoute = paths["/containers/{id}/archive"]["head"]
export type ContainerArchivePutRoute = paths["/containers/{id}/archive"]["put"]
export type ContainerExecRoute = paths["/containers/{id}/exec"]["post"]
export type ExecStartRoute = paths["/exec/{id}/start"]["post"]
export type ExecInspectRoute = paths["/exec/{id}/json"]["get"]
export type ExecResizeRoute = paths["/exec/{id}/resize"]["post"]
export type ContainerPruneRoute = paths["/containers/prune"]["post"]
