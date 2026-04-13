import type { paths } from "../../v1.54"

export type ListVolumesRoute = paths["/volumes"]["get"]
export type CreateVolumeRoute = paths["/volumes/create"]["post"]
type VolumeRoute = paths["/volumes/{name}"]
export type InspectVolumeRoute = VolumeRoute["get"]
export type UpdateVolumeRoute = VolumeRoute["put"]
export type DeleteVolumeRoute = VolumeRoute["delete"]
export type PruneVolumeRoute = paths["/volumes/prune"]["post"]
