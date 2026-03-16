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
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-xs">
        <Bolt className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-blue-300">Clients:</span>
        <span className="font-semibold text-blue-100">
          {clients?.length || 0}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-xs">
        <Server className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-emerald-300">Hosts:</span>
        <span className="font-semibold text-emerald-100">
          {hosts?.length || 0}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-xs">
        <HardDrive className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-orange-300">DockNodes:</span>
        <span className="font-semibold text-orange-100">
          {dockNodes?.length || 0}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-xs">
        <Container className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-orange-300">Containers:</span>
        <span className="font-semibold text-orange-100">
          {containers?.length || 0}
        </span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-xs">
        <span className="text-green-300">Online (Total):</span>
        <span className="font-semibold text-green-100">
          {onlineClients + onlineHosts + onlineDockNodes}
        </span>
      </div>
    </div>
  );
}
