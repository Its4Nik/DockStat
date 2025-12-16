import { applyMixins } from "./_mixin"
import { Containers } from "./containers"
import { DockerClientManagerCore } from "./core"
import { Hosts } from "./hosts"
import { Images } from "./images"
import { Monitoring } from "./monitoring"
import { Networks } from "./networks"
import { System } from "./system"
import { Volumes } from "./volumes"

const DCM = applyMixins(
  DockerClientManagerCore,
  Hosts,
  Containers,
  Images,
  Networks,
  Volumes,
  System,
  Monitoring
)

export default DCM
