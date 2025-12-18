import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { Container, Server } from "lucide-react"
import { useState } from "react"
import { HostDetailModal } from "./HostDetailModal"
import type { Host, HostsListProps } from "./types"

export function HostsList({
  hosts,
  clients = [],
  workers = [],
  containerCounts = [],
}: HostsListProps) {
  // Create a map for quick container count lookup by hostId
  const containerCountMap = new Map<number, number>(
    containerCounts.map((c) => [c.hostId, c.containerCount])
  )
  const clientMap = new Map(clients.map((c) => [c.clientId, c]))
  const [selectedHost, setSelectedHost] = useState<Host | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleHostClick = (host: Host) => {
    setSelectedHost(host)
    setModalOpen(true)
  }

  const selectedClient = selectedHost ? clientMap.get(selectedHost.clientId) : null
  const selectedWorker = selectedHost
    ? workers.find((w) => w.clientId === selectedHost.clientId)
    : null
  const selectedContainerCount = selectedHost ? (containerCountMap.get(selectedHost.id) ?? 0) : 0

  if (hosts.length === 0) {
    return (
      <Card variant="outlined" size="sm" className="w-full">
        <CardBody className="text-center text-muted-text py-8">
          <Server className="mx-auto mb-2 opacity-50" size={32} />
          <p>No hosts registered</p>
          <p className="text-xs mt-1">Add a host to start monitoring</p>
        </CardBody>
      </Card>
    )
  }

  const hostsByClient = hosts.reduce(
    (acc, host) => {
      const clientId = host.clientId
      if (!acc[clientId]) {
        acc[clientId] = []
      }
      acc[clientId].push(host)
      return acc
    },
    {} as Record<number, Host[]>
  )

  // Get monitoring status for each client
  const getClientMonitoringStatus = (clientId: number): boolean => {
    const worker = workers.find((w) => w.clientId === clientId)
    return worker?.isMonitoring ?? false
  }

  return (
    <Card variant="default" size="sm" className="w-full">
      <CardHeader className="text-lg flex items-center justify-between">
        <span>Hosts</span>
        <Badge variant="secondary" size="sm" rounded>
          {hosts.length}
        </Badge>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-divider-color">
          {Object.entries(hostsByClient).map(([clientIdStr, clientHosts]) => {
            const clientId = Number(clientIdStr)
            const client = clientMap.get(clientId)
            const clientName = client?.clientName ?? `Client ${clientId}`
            const isMonitoring = getClientMonitoringStatus(clientId)

            return (
              <div key={clientId} className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="primary" size="sm" outlined>
                    {clientName}
                  </Badge>
                  <span className="text-xs text-muted-text">
                    {clientHosts.length} host{clientHosts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-2 pl-2">
                  {clientHosts.map((host) => (
                    <button
                      type="button"
                      key={host.id}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-card-flat-bg transition-colors cursor-pointer w-full text-left"
                      onClick={() => handleHostClick(host)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isMonitoring ? "bg-badge-success-bg" : "bg-badge-secondary-bg"
                          }`}
                        />
                        <div>
                          <span className="font-medium text-sm">{host.name}</span>
                          {host.host && (
                            <div className="text-xs text-muted-text">
                              {host.secure ? "https" : "http"}://{host.host}
                              {host.port ? `:${host.port}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm" className="flex items-center gap-1">
                          <Container size={12} />
                          {containerCountMap.get(host.id) ?? 0}
                        </Badge>
                        <Badge variant="secondary" size="sm" outlined>
                          ID: {host.id}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>

      <HostDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        host={selectedHost}
        client={selectedClient}
        worker={selectedWorker}
        containerCount={selectedContainerCount}
      />
    </Card>
  )
}
