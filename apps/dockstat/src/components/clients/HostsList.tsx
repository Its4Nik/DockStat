import { Badge, Card } from "@dockstat/ui"
import { Globe, Server } from "lucide-react"

interface Host {
  name: string
  id: number
  clientId: number
  reachable: boolean
}

interface HostsListProps {
  hosts?: Host[]
}

export function HostsList({ hosts }: HostsListProps) {
  if (!hosts || hosts.length === 0) {
    return (
      <>
        <Card size="sm" variant="outlined" className="w-full mb-4">
          <div className="flex items-center gap-2">
            <Server size={20} />
            <span className="font-semibold text-2xl">Docker Hosts</span>
          </div>
        </Card>
        <Card variant="dark">
          <div className="text-center text-muted-text py-8">No hosts configured</div>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card size="sm" variant="flat" className="w-full mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={20} className="text-accent" />
            <span className="font-semibold text-2xl">Docker Hosts</span>
          </div>
          <Badge variant="primary" size="sm">
            {hosts.length} {hosts.length === 1 ? "Host" : "Hosts"}
          </Badge>
        </div>
      </Card>

      <Card variant="dark">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {hosts.map((host) => (
            <div
              key={host.id}
              className="flex flex-col p-4 rounded-lg bg-card-default-bg border border-card-default-border hover:border-card-outlined-border transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-blue-500 shrink-0" />
                  <span className="font-semibold text-base truncate">{host.name}</span>
                </div>
                <Badge variant="secondary" size="sm">
                  #{host.id}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-text">Client ID:</span>
                  <Badge variant="primary" size="sm">
                    {host.clientId}
                  </Badge>
                </div>

                <div className="pt-2 mt-2 border-t border-card-outlined-border">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-text">
                    <div
                      className={`w-2 h-2 rounded-full ${host.reachable ? "bg-success" : "bg-error"} animate-pulse`}
                    />
                    <span>{host.reachable ? "Connected" : "Disconnected"}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}
