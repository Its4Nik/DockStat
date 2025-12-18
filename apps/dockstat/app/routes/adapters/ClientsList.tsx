import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { DeleteClientButton, MonitoringToggle } from "./forms"
import { getClientsWithStatus, type Client, type Worker } from "./types"

interface ClientsListProps {
  clients: Client[]
  workers: Worker[]
}

export function ClientsList({ clients, workers }: ClientsListProps) {
  const clientsWithStatus = getClientsWithStatus(clients, workers)

  if (clientsWithStatus.length === 0) {
    return (
      <Card variant="outlined" size="sm">
        <CardBody className="text-center text-muted-text">No clients registered</CardBody>
      </Card>
    )
  }

  return (
    <Card variant="default" size="sm" className="w-full">
      <CardHeader className="text-lg flex items-center justify-between">
        <span>Docker Clients</span>
        <Badge variant="secondary" size="sm" rounded>
          {clientsWithStatus.length}
        </Badge>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-card-default-border">
          {clientsWithStatus.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-card-flat-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    client.isMonitoring ? "bg-badge-success-bg" : "bg-badge-secondary-bg"
                  }`}
                />
                <div>
                  <span className="font-medium">{client.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" size="sm" outlined>
                      ID: {client.id}
                    </Badge>
                    {client.initialized && (
                      <Badge variant="success" size="sm">
                        Initialized
                      </Badge>
                    )}
                    {client.hostsManaged > 0 && (
                      <Badge variant="primary" size="sm" outlined>
                        {client.hostsManaged} host{client.hostsManaged !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MonitoringToggle clientId={client.id} isMonitoring={client.isMonitoring} />
                <DeleteClientButton clientId={client.id} clientName={client.name} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
