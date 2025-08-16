import type { ContainerInfo } from "./docker";

interface PluginInfo {
  name: string;
  status: "active" | "inactive";
  version?: string;
  usedHooks: {
    onContainerStart?: boolean;
    onContainerStop?: boolean;
    onContainerExit?: boolean;
    onContainerCreate?: boolean;
    onContainerKill?: boolean;
    handleContainerDie?: boolean;
    onContainerDestroy?: boolean;
    onContainerPause?: boolean;
    onContainerUnpause?: boolean;
    onContainerRestart?: boolean;
    onContainerUpdate?: boolean;
    onContainerRename?: boolean;
    onContainerHealthStatus?: boolean;
    onHostUnreachable?: boolean;
    onHostReachableAgain?: boolean;
  };
}

interface Plugin {
  name: string;
  version: string;

  // Container lifecycle hooks
  onContainerStart?: (containerInfo: ContainerInfo) => void;
  onContainerStop?: (containerInfo: ContainerInfo) => void;
  onContainerExit?: (containerInfo: ContainerInfo) => void;
  onContainerCreate?: (containerInfo: ContainerInfo) => void;
  onContainerKill?: (ContainerInfo: ContainerInfo) => void;
  handleContainerDie?: (ContainerInfo: ContainerInfo) => void;
  onContainerDestroy?: (containerInfo: ContainerInfo) => void;
  onContainerPause?: (containerInfo: ContainerInfo) => void;
  onContainerUnpause?: (containerInfo: ContainerInfo) => void;
  onContainerRestart?: (containerInfo: ContainerInfo) => void;
  onContainerUpdate?: (containerInfo: ContainerInfo) => void;
  onContainerRename?: (containerInfo: ContainerInfo) => void;
  onContainerHealthStatus?: (containerInfo: ContainerInfo) => void;

  // Host lifecycle hooks
  onHostUnreachable?: (host: string, err: string) => void;
  onHostReachableAgain?: (host: string) => void;
}

export type { Plugin, PluginInfo };
