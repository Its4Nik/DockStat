import { DockerClientManagerCore } from "./core"
import { Hosts } from "./hosts"
import { Containers } from "./containers"
import { Images } from "./images"
import { Networks } from "./networks"
import { Volumes } from "./volumes"
import { System } from "./system"
import { Monitoring } from "./monitoring"
import { applyMixins } from "./_mixin"

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
