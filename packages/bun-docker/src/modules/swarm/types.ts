import type { paths } from "../../v1.54"

export type InspectSwarmRoute = paths["/swarm"]["get"]
export type InitSwarmRoute = paths["/swarm/init"]["post"]
export type JoinSwarmRoute = paths["/swarm/join"]["post"]
export type LeaveSwarmRoute = paths["/swarm/leave"]["post"]
export type UpdateSwarmRoute = paths["/swarm/update"]["post"]
export type UnlockKeySwarmRoute = paths["/swarm/unlockkey"]["get"]
export type UnlockSwarmRoute = paths["/swarm/unlock"]["post"]
