import type { ContainerStats } from "dockerode";
import type Docker from "dockerode";

interface DockerHost {
  name: string;
  hostAddress: string;
  secure: boolean;
  id: number;
}

interface ContainerInfo {
  id: string;
  hostId: number;
  name: string;
  image: string;
  status: string;
  state: string;
  cpuUsage: number;
  memoryUsage: number;
  stats?: ContainerStats;
  info?: Docker.ContainerInfo;
}

interface HostStats {
  hostName: string;
  hostId: number;
  dockerVersion: string;
  apiVersion: string;
  os: string;
  architecture: string;
  totalMemory: number;
  totalCPU: number;
  labels: string[];
  containers: number;
  containersRunning: number;
  containersStopped: number;
  containersPaused: number;
  images: number;
}

export type { HostStats, ContainerInfo, DockerHost };
