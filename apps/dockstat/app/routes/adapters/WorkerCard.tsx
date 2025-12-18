import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { formatBytes, formatDuration } from "@dockstat/utils"
import type { Host, Worker } from "./types"

interface WorkerCardProps {
  worker: Worker
  hosts?: Host[]
}

export function WorkerCard({ worker, hosts = [] }: WorkerCardProps) {
  const workerHosts = hosts.filter((h) => h.clientId === worker.clientId)

  return (
    <Card variant="outlined" size="sm" className="min-w-60 max-w-75">
      <CardHeader className="text-base! pb-2! flex items-center justify-between gap-2">
        <span className="truncate font-medium">{worker.clientName}</span>
        <Badge variant={worker.isMonitoring ? "success" : "secondary"} size="sm" rounded>
          {worker.isMonitoring ? "Monitoring" : "Idle"}
        </Badge>
      </CardHeader>
      <CardBody className="py-2! space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between">
            <span className="text-muted-text">Worker</span>
            <span>#{worker.workerId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Client</span>
            <span>#{worker.clientId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Streams</span>
            <span>{worker.activeStreams}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Hosts</span>
            <span>{worker.hostsManaged}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Memory</span>
            <span>{formatBytes(worker.memoryUsage.heapUsed)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-text">Uptime</span>
            <span>{formatDuration(worker.uptime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Badge variant={worker.initialized ? "success" : "warning"} size="sm">
            {worker.initialized ? "Initialized" : "Not Init"}
          </Badge>
        </div>

        {workerHosts.length > 0 && (
          <div className="pt-2 border-t border-divider-color">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-text uppercase tracking-wide">
                Hosts ({workerHosts.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
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
