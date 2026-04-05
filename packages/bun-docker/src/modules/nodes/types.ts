import type { paths } from "../../v1.54"

export type ListNodesRoute = paths["/nodes"]["get"]
export type NodeInspectRoute = paths["/nodes/{id}"]["get"]
export type DeleteNodeRoute = paths["/nodes/{id}"]["delete"]
export type UpdateNodeRoute = paths["/nodes/{id}/update"]["post"]
