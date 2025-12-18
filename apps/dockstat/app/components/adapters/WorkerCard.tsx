import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { formatBytes, formatDuration } from "@dockstat/utils"
import type { WorkerCardProps } from "./types"
import { Check } from "lucide-react"

export function WorkerCard({ worker, hosts = [] }: WorkerCardProps) {
  const workerHosts = hosts.filter((h) => h.clientId === worker.clientId)

  return (
    <Card variant="outlined" size="sm" className="relative min-w-60 max-w-75">
      <CardHeader className="text-base! pb-2! flex items-center justify-between gap-2">
        <span className="truncate font-medium">{worker.clientName}</span>
        <div className="flex gap-1.5">
          <Badge variant={worker.isMonitoring ? "success" : "secondary"} size="sm" rounded>
            {worker.isMonitoring ? "Monitoring" : "Idle"}
          </Badge>
          <Badge
            variant={worker.initialized ? "success" : "warning"}
            rounded
            size="sm"
            className=""
          >
            {worker.initialized ? <Check size={15} /> : "Not Init"}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="py-2! space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <div className="flex justify-between">
            <span className="text-muted-text mr-2">Worker</span>
            <span className="font-medium">#{worker.workerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text mr-2">Client</span>
            <span className="font-medium">#{worker.clientId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text mr-2">Streams</span>
            <span className="font-medium">{worker.activeStreams}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text mr-2">Hosts</span>
            <span className="font-medium">{worker.hostsManaged}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text mr-2">Memory</span>
            <span className="font-medium">{formatBytes(worker.memoryUsage?.rss || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text mr-2">Uptime</span>
            <span className="font-medium">{formatDuration(worker.uptime)}</span>
          </div>
        </div>

        {workerHosts.length > 0 && (
          <div className="pt-2 border-t border-divider-color">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-text uppercase tracking-wide">
                Hosts ({workerHosts.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {workerHosts.map((host) => (
                <Badge key={host.id} variant="primary" size="sm" outlined>
                  {host.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
