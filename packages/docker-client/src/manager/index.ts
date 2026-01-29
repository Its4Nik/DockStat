import { applyMixins } from "../shared/mixin"
import { Containers } from "./containers"
import { DockerClientManagerCore } from "./core"
import { Hosts } from "./hosts"
import { Images } from "./images"
import { Monitoring } from "./monitoring"
import { Networks } from "./networks"
import { Streams } from "./stream"
import { System } from "./system"
import { Volumes } from "./volumes"

import DockerClient from "../client"

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

export const client = DockerClient
export default DCM
