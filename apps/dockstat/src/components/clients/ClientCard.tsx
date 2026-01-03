import type { DOCKER } from "@dockstat/typings"
import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { formatDuration } from "@dockstat/utils"
import { Activity, CheckCircle, Clock, XCircle } from "lucide-react"

interface ClientCardProps {
  client: {
    id?: number
    name: string
    options: DOCKER.DockerAdapterOptions
  }
  workerInfo?: {
    workerId: number
    hostsManaged: number
    activeStreams: number
    isMonitoring: boolean
    initialized: boolean
    uptime: number
  }
}

export function ClientCard({ client, workerInfo }: ClientCardProps) {
  return (
    <Card size="sm" variant="outlined" hoverable className="min-w-70 max-w-80">
      <CardHeader size="sm" className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg truncate">{client.name}</span>
          {workerInfo?.initialized ? (
            <CheckCircle size={16} className="text-green-500 shrink-0" />
          ) : (
            <XCircle size={16} className="text-red-500 shrink-0" />
          )}
        </div>
        {client.id && (
          <Badge variant="secondary" size="sm">
            ID: {client.id}
          </Badge>
        )}
      </CardHeader>

      <CardBody className="space-y-3">
        {/* Worker Status */}
        {workerInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Worker ID:</span>
              <Badge variant="primary" size="sm">
                {workerInfo.workerId}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Hosts:</span>
              <Badge variant="secondary" size="sm">
                {workerInfo.hostsManaged}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Active Streams:</span>
              <Badge variant={workerInfo.activeStreams > 0 ? "success" : "secondary"} size="sm">
                {workerInfo.activeStreams}
              </Badge>
            </div>

            {workerInfo.isMonitoring && (
              <div className="flex items-center gap-2 text-sm">
                <Activity size={14} className="text-green-500" />
                <span className="text-green-500 font-medium">Monitoring Active</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text flex items-center gap-1">
                <Clock size={14} />
                Uptime:
              </span>
              <span className="text-primary-text font-medium">
                {formatDuration(workerInfo.uptime)}
              </span>
            </div>
          </div>
        )}

        {/* Client Options */}
        <div className="pt-2 border-t border-card-outlined-border space-y-2">
          <div className="text-xs font-semibold text-muted-text uppercase">Configuration</div>

          {client.options.defaultTimeout && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Timeout:</span>
              <Badge variant="secondary" size="sm">
                {formatDuration(client.options.defaultTimeout)}
              </Badge>
            </div>
          )}

          {client.options.enableMonitoring !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Monitoring:</span>
              <Badge variant={client.options.enableMonitoring ? "success" : "secondary"} size="sm">
                {client.options.enableMonitoring ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          )}

          {client.options.retryAttempts && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Retry Attempts:</span>
              <Badge variant="secondary" size="sm">
                {client.options.retryAttempts}
              </Badge>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
