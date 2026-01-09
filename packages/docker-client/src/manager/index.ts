import { applyMixins } from "../shared/mixin"
import { Containers } from "./containers"
import { DockerClientManagerCore } from "./core"
import { Hosts } from "./hosts"
import { Images } from "./images"
import { Monitoring } from "./monitoring"
import { Networks } from "./networks"
import { System } from "./system"
import { Volumes } from "./volumes"
import { Streams } from "./stream"

const DCM = applyMixins(
  DockerClientManagerCore,
  Hosts,
  Containers,
  Images,
  Networks,
  Volumes,
  System,
  Monitoring,
  Streams
)

export default DCM
