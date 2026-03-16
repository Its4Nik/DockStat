import { Bolt, Container, HardDrive, Server } from "lucide-react";
import type { DOCKER } from "@dockstat/typings";

type GraphClient = {
  id: number;
  name: string;
  initialized: boolean;
};

type GraphHost = {
  id: number;
  name: string;
  clientId: number;
  reachable: boolean;
};

type GraphDockNode = {
  id: number;
  name: string;
  hostname: string;
  port: number;
  reachable: "OK" | "NO" | "DockNode not initialised";
};

export function StatsDisplay({
  clients,
  hosts,
  dockNodes,
  containers,
}: {
  clients: GraphClient[];
  hosts: GraphHost[];
  dockNodes: GraphDockNode[];
  containers: DOCKER.ContainerInfo[];
}) {
  const onlineClients = clients?.filter((c) => c.initialized).length || 0;
  const onlineHosts = hosts?.filter((h) => h.reachable).length || 0;
  const onlineDockNodes =
    dockNodes?.filter((d) => d.reachable === "OK").length || 0;

  return (
    <div className="flex gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-graph-client-card-bg border border-graph-client-card-border/40 text-xs">
        <Bolt className="h-3.5 w-3.5 text-graph-client-text-secondary" />
        <span className="text-graph-client-text-secondary">Clients:</span>
        <span className="font-semibold text-graph-client-text-primary">
          {clients?.length || 0}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-graph-host-card-bg border border-graph-host-card-border/40 text-xs">
        <Server className="h-3.5 w-3.5 text-graph-host-text-secondary" />
        <span className="text-graph-host-text-secondary">Hosts:</span>
        <span className="font-semibold text-graph-host-text-primary">
          {hosts?.length || 0}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-graph-docknode-card-bg border border-graph-docknode-card-border/40 text-xs">
        <HardDrive className="h-3.5 w-3.5 text-graph-docknode-text-secondary" />
        <span className="text-graph-docknode-text-secondary">DockNodes:</span>
        <span className="font-semibold text-graph-docknode-text-primary">
          {dockNodes?.length || 0}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-graph-container-card-bg border border-graph-container-card-border/40 text-xs">
        <Container className="h-3.5 w-3.5 text-graph-container-text-secondary" />
        <span className="text-graph-container-text-secondary">Containers:</span>
        <span className="font-semibold text-graph-container-text-primary">
          {containers?.length || 0}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-badge-success-bg/10 border border-badge-success-outlined-border/40 text-xs">
        <span className="text-badge-success-outlined-text">
          Online (Total):
        </span>
        <span className="font-semibold text-badge-success-outlined-text">
          {onlineClients + onlineHosts + onlineDockNodes}
        </span>
      </div>
    </div>
  );
}
