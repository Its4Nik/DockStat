import { Adapter } from "!L+A/adapters"
import { Divider, Slides } from "@dockstat/ui"
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

export default function Clients() {
  const data = useLoaderData<typeof loader>()

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
  const containers = data.containers ?? { total: 0, perHost: [] }

  const clients = status.workers

  const monitoringHosts = workers
    .filter((w) => w.isMonitoring)
    .reduce((sum, w) => sum + w.hostsManaged, 0)

  return (
    <div className="w-[95vw] mx-auto py-6 space-y-6">
      {/* Stats Row - Now using StatusBar component with correct values */}
      <StatusBar
        totalClients={status.totalClients}
        totalHosts={status.totalHosts}
        activeWorkers={status.activeWorkers}
        totalWorkers={status.totalWorkers}
        monitoringHosts={monitoringHosts}
        totalContainers={containers.total}
      />

      <Divider />

      <Slides
        connected={true}
        buttonPosition="right"
        className="w-full"
        header="Overview"
        hideable={true}
      >
        {{
          "+ Add Client": <RegisterClientForm />,
          "+ Add Host": <AddHostForm clients={clients} />,
        }}
      </Slides>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients List - pass workers so it can merge status */}
        <ClientsList clients={clients} workers={workers} hosts={hosts} />

        {/* Hosts List */}
        <HostsList
          hosts={hosts}
          clients={clients}
          workers={workers}
          containerCounts={containers.perHost}
        />
      </div>

      <Divider label="Worker Pool" />

      {/* Workers Section */}
      <WorkersList workers={workers} hosts={hosts} />
    </div>
  )
}
