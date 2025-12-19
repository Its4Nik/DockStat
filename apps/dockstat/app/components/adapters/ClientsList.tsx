import { Badge, Card, CardBody, CardHeader, Modal } from "@dockstat/ui"
import { Database, Edit3 } from "lucide-react"
import { useState } from "react"
import { ClientDetailModal } from "./ClientDetailModal"
import { CreateMonitoringManagerButton } from "./forms/CreateMonitoringManagerButton"
import { DeleteClientButton } from "./forms/DeleteClientButton"
import { EditClientForm } from "./forms/EditClientForm"
import { MonitoringToggle } from "./forms/MonitoringToggle"
import type { Client, ClientsListProps } from "./types"

export function ClientsList({ clients, workers, hosts = [] }: ClientsListProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)

  const handleClientClick = (clientId: number) => {
    const clientConfig = clients.find((c) => c.clientId === clientId)
    if (clientConfig) {
      setSelectedClient(clientConfig)
      setModalOpen(true)
    }
  }

  const handleEditClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation()
    setEditClient(client)
    setEditModalOpen(true)
  }

  const selectedWorker = selectedClient
    ? workers.find((w) => w.clientId === selectedClient.clientId)
    : null

  const editWorker = editClient ? workers.find((w) => w.clientId === editClient.clientId) : null

  if (clients.length === 0) {
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
          {clients.length}
        </Badge>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-card-default-border">
          {clients.map((client) => (
            <button
              type="button"
              key={client.clientId}
              className="flex items-center justify-between px-4 py-3 hover:bg-card-flat-bg transition-colors cursor-pointer w-full text-left"
              onClick={() => handleClientClick(client.clientId)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    client.isMonitoring ? "bg-badge-success-bg" : "bg-badge-secondary-bg"
                  }`}
                />
                <div>
                  <span className="font-medium">{client.clientName}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" size="sm" outlined>
                      ID: {client.clientId}
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
                <button
                  type="button"
                  onClick={(e) => handleEditClick(e, client)}
                  className="p-1.5 rounded-md hover:bg-card-elevated-bg text-muted-text hover:text-accent transition-colors"
                  title="Edit client"
                >
                  <Edit3 size={16} />
                </button>
                {client.hasMonitoringManager ? (
                  <MonitoringToggle clientId={client.clientId} isMonitoring={client.isMonitoring} />
                ) : (
                  <CreateMonitoringManagerButton clientId={client.clientId} size="sm" />
                )}
                <DeleteClientButton
                  clientId={client.clientId}
                  clientName={client.clientName}
                  size="sm"
                />
              </fieldset>
            </button>
          ))}
        </div>
      </CardBody>

      {selectedClient && (
        <ClientDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          client={selectedClient}
          worker={selectedWorker}
          hosts={hosts}
        />
      )}

      {editClient && (
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} size="xl">
          <EditClientForm
            client={editClient}
            worker={editWorker}
            onClose={() => setEditModalOpen(false)}
          />
        </Modal>
      )}
    </Card>
  )
}
