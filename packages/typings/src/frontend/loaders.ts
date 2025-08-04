import type { stacks_config } from "../database";
import type { ContainerInfo, HostStats } from "../docker";
import type { PluginInfo } from "../plugin";

export interface DefaultLoader {
  containers: Promise<ContainerInfo[]>;
  hosts: Promise<HostStats[]>;
  stacks: stacks_config[];
  plugins: PluginInfo[];
}
