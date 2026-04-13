import type { DOCKER } from "@dockstat/typings"
import { Badge, Button, Card, CardBody, CardHeader, type CardProps } from "@dockstat/ui"
import { formatDuration } from "@dockstat/utils"
import { Activity, CheckCircle, Clock, Trash2, XCircle } from "lucide-react"
import { useDockerClientMutations } from "@/hooks/mutations"

interface ClientCardProps {
  variant?: CardProps["variant"]
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

export function ClientCard({ client, workerInfo, variant = "outlined" }: ClientCardProps) {
  const { deleteClientMutation } = useDockerClientMutations()

  return (
    <Card
      className="min-w-70 max-w-80"
      hoverable
      size="sm"
      variant={variant}
    >
      <CardHeader
        className="flex items-center justify-between pb-2"
        size="sm"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg truncate">{client.name}</span>
          {workerInfo?.initialized ? (
            <CheckCircle
              className="text-green-500 shrink-0"
              size={16}
            />
          ) : (
            <XCircle
              className="text-red-500 shrink-0"
              size={16}
            />
          )}
        </div>
        {client.id && (
          <>
            <Badge
              size="sm"
              variant="secondary"
            >
              ID: {client.id}
            </Badge>
            <Button
              onClick={() => deleteClientMutation.mutateAsync({ clientId: Number(client.id) })}
              size="xs"
              variant="danger"
            >
              <Trash2 size={16} />{" "}
            </Button>
          </>
        )}
      </CardHeader>

      <CardBody className="space-y-3">
        {/* Worker Status */}
        {workerInfo && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Worker ID:</span>
              <Badge
                size="sm"
                variant="primary"
              >
                {workerInfo.workerId}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Hosts:</span>
              <Badge
                size="sm"
                variant="secondary"
              >
                {workerInfo.hostsManaged}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Active Streams:</span>
              <Badge
                size="sm"
                variant={workerInfo.activeStreams > 0 ? "success" : "secondary"}
              >
                {workerInfo.activeStreams}
              </Badge>
            </div>

            {workerInfo.isMonitoring && (
              <div className="flex items-center gap-2 text-sm">
                <Activity
                  className="text-success"
                  size={14}
                />
                <span className="text-success font-medium">Monitoring Active</span>
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
              <Badge
                size="sm"
                variant="secondary"
              >
                {formatDuration(client.options.defaultTimeout)}
              </Badge>
            </div>
          )}

          {client.options.enableMonitoring !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Monitoring Manager:</span>
              <Badge
                size="sm"
                variant={client.options.enableMonitoring ? "success" : "secondary"}
              >
                {client.options.enableMonitoring ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          )}

          {client.options.retryAttempts && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-text">Retry Attempts:</span>
              <Badge
                size="sm"
                variant="secondary"
              >
                {client.options.retryAttempts}
              </Badge>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
