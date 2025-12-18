import { Divider } from "@dockstat/ui"
import { Activity, Container, Database, Layers, Server } from "lucide-react"
import { StatCard } from "./StatCard"
import type { StatusBarProps } from "./types"

export function StatusBar({
  totalClients,
  totalHosts,
  activeWorkers,
  totalWorkers,
  monitoringHosts,
  totalContainers,
}: StatusBarProps) {
  const monitoringVariant = monitoringHosts > 0 ? "success" : "warning"
  const workersVariant = activeWorkers > 0 ? "success" : "warning"

  return (
    <div className="flex w-full justify-between flex-wrap gap-4">
      <StatCard
        label="Total Clients"
        value={totalClients}
        icon={<Database size={20} />}
        variant="default"
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Total Hosts"
        value={totalHosts}
        icon={<Server size={20} />}
        variant="default"
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Monitoring"
        value={`${monitoringHosts}/${totalHosts}`}
        icon={<Activity size={20} />}
        variant={monitoringVariant}
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Active Workers"
        value={`${activeWorkers}/${totalWorkers}`}
        icon={<Layers size={20} />}
        variant={workersVariant}
      />
      <Divider className="w-10! my-auto" variant="dotted" />
      <StatCard
        label="Containers"
        value={totalContainers}
        icon={<Container size={20} />}
        variant="default"
      />
    </div>
  )
}
