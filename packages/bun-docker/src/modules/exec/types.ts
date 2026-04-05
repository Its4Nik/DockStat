import type { paths } from "../../v1.54"

export type CreateExecRoute = paths["/containers/{id}/exec"]["post"]
export type StartExecRoute = paths["/exec/{id}/start"]["post"]
export type InspectExecRoute = paths["/exec/{id}/json"]["get"]
export type ResizeExecRoute = paths["/exec/{id}/resize"]["post"]
