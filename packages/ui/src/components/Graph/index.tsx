export { ClientNode } from "./nodes/client"
export { ContainerNode } from "./nodes/container"
export { DockNode } from "./nodes/docknode"
export { HostNode } from "./nodes/host"

import { ClientNode } from "./nodes/client"
import { ContainerNode } from "./nodes/container"
import { DockNode } from "./nodes/docknode"
import { HostNode } from "./nodes/host"

export const nodeTypes = {
  client: ClientNode,
  host: HostNode,
  docknode: DockNode,
  container: ContainerNode,
}
