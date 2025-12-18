import { Adapter } from "!L+A/adapters"
import { Button, Card, CardHeader, Divider } from "@dockstat/ui"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useLoaderData } from "react-router"
import {
  AddHostForm,
  ClientsList,
  HostsList,
  RegisterClientForm,
  StatusBar,
  WorkersList,
} from "~/components/adapters"

export const loader = Adapter.loader
export const action = Adapter.action

export default function Adapters() {
  const data = useLoaderData<typeof loader>()

  const [showClientForm, setShowClientForm] = useState(false)
  const [showHostForm, setShowHostForm] = useState(false)

  // Extract data with safe defaults
  const status = data?.status ?? {
    totalWorkers: 0,
    activeWorkers: 0,
    totalHosts: 0,
    totalClients: 0,
    averageHostsPerWorker: 0,
    workers: [],
    hosts: [],
  }

  const workers = status.workers ?? []
  const hosts = status.hosts ?? []

  const clients = status.workers

  // Compute monitoring hosts count (hosts belonging to clients that are actively monitoring)
  const monitoringHosts = workers
    .filter((w) => w.isMonitoring)
    .reduce((sum, w) => sum + w.hostsManaged, 0)

  // For now, totalContainers is not available from the status endpoint
  // This would need backend support to aggregate container counts
  // Setting to 0 as a placeholder - you may want to add an API endpoint for this
  const totalContainers = 0

  return (
    <div className="w-[95vw] mx-auto py-6 space-y-6">
      {/* Header */}
      <Card variant="flat" size="sm" className="w-full">
        <CardHeader className="border-b-0 flex justify-between pb-0">
          <span>Docker Adapters Overview</span>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowClientForm(!showClientForm)}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Add Client
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHostForm(!showHostForm)}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Add Host
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Forms Row */}
      {(showClientForm || showHostForm) && (
        <div className="flex flex-wrap gap-4">
          {showClientForm && (
            <RegisterClientForm
              onSuccess={() => setShowClientForm(false)}
              onCancel={() => setShowClientForm(false)}
            />
          )}
          {showHostForm && <AddHostForm clients={clients} onClose={() => setShowHostForm(false)} />}
        </div>
      )}

      {/* Stats Row - Now using StatusBar component with correct values */}
      <StatusBar
        totalClients={status.totalClients}
        totalHosts={status.totalHosts}
        activeWorkers={status.activeWorkers}
        totalWorkers={status.totalWorkers}
        monitoringHosts={monitoringHosts}
        totalContainers={totalContainers}
      />

      <Divider />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients List - pass workers so it can merge status */}
        <ClientsList clients={clients} workers={workers} hosts={hosts} />

        {/* Hosts List */}
        <HostsList hosts={hosts} clients={clients} workers={workers} />
      </div>

      <Divider label="Worker Pool" />

      {/* Workers Section */}
      <WorkersList workers={workers} hosts={hosts} />
    </div>
  )
}
