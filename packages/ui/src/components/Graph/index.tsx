export * from "./nodes/client"
export * from "./nodes/container"
export * from "./nodes/docknode"
export * from "./nodes/host"

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
