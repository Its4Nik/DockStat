import { Badge, Card, CardBody, CardHeader } from "@dockstat/ui"
import { useState } from "react"
import { DeleteClientButton, MonitoringToggle } from "./forms"
import { ClientDetailModal } from "./ClientDetailModal"
import {
  getClientsWithStatus,
  type Client,
  type ClientWithConfig,
  type Host,
  type Worker,
} from "./types"
import { Database } from "lucide-react"

interface ClientsListProps {
  clients: Client[]
  clientsWithConfig: ClientWithConfig[]
  workers: Worker[]
  hosts?: Host[]
}

export function ClientsList({ clients, clientsWithConfig, workers, hosts = [] }: ClientsListProps) {
  const clientsWithStatus = getClientsWithStatus(clients, workers)
  const [selectedClient, setSelectedClient] = useState<ClientWithConfig | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleClientClick = (clientId: number) => {
    const clientConfig = clientsWithConfig.find((c) => c.id === clientId)
    if (clientConfig) {
      setSelectedClient(clientConfig)
      setModalOpen(true)
    }
  }

  const selectedWorker = selectedClient
    ? workers.find((w) => w.clientId === selectedClient.id)
    : null

  if (clientsWithStatus.length === 0) {
    return (
      <Card variant="outlined" size="sm" className="w-full">
        <CardBody className="text-center text-muted-text py-8">
          <Database className="mx-auto mb-2 opacity-50" size={32} />
          <p>No clients registered</p>
          <p className="text-xs mt-1">Add a client to configure Hosts to monitor</p>
        </CardBody>
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
            <button
              type="button"
              key={client.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-card-flat-bg transition-colors cursor-pointer w-full text-left"
              onClick={() => handleClientClick(client.id)}
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

              <fieldset
                className="flex items-center gap-3 border-none p-0 m-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <MonitoringToggle clientId={client.id} isMonitoring={client.isMonitoring} />
                <DeleteClientButton clientId={client.id} clientName={client.name} size="sm" />
              </fieldset>
            </button>
          ))}
        </div>
      </CardBody>

      <ClientDetailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        client={selectedClient}
        worker={selectedWorker}
        hosts={hosts}
      />
    </Card>
  )
}
