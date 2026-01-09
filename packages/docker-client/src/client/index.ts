import { applyMixins } from "../shared/mixin"
import { Containers } from "./mixins/containers"
import { DockerClientBase } from "./mixins/core/base"
import { Hosts } from "./mixins/hosts"
import { Images } from "./mixins/images"
import { Monitoring } from "./mixins/monitoring"
import { Networks } from "./mixins/networks"
import { System } from "./mixins/system"
import { Volumes } from "./mixins/volumes"

const DockerClient = applyMixins(
  DockerClientBase,
  Hosts,
  Containers,
  Images,
  Networks,
  Volumes,
  System,
  Monitoring
)

export { DockerClientBase }

export interface DockerClientInstance
  extends DockerClientBase,
    Hosts,
    Containers,
    Images,
    Networks,
    Volumes,
    System,
    Monitoring {}

export default DockerClient
