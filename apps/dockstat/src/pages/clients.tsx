import { Divider } from "@dockstat/ui"
import { useQuery } from "@tanstack/react-query"
import { Hammer, Split } from "lucide-react"
import { ClientCard } from "@/components/clients/ClientCard"
import { HostsList } from "@/components/clients/HostsList"
import { PoolStatsCard } from "@/components/clients/PoolStatsCard"
import { WorkersTable } from "@/components/clients/WorkersTable"
import { fetchClients, fetchHosts, fetchPoolStatus } from "@/lib/queries"
import { useContext } from "react"
import { PageHeadingContext } from "@/contexts/pageHeadingContext"

export default function ClientsPage() {
  useContext(PageHeadingContext).setHeading("Clients & Workers")

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["fetchDockerClients"],
    queryFn: fetchClients,
  })

  const { data: poolStatus, isLoading: poolLoading } = useQuery({
    queryKey: ["fetchPoolStatus"],
    queryFn: fetchPoolStatus,
  })

  const { data: hosts, isLoading: hostsLoading } = useQuery({
    queryKey: ["fetchHosts"],
    queryFn: fetchHosts,
  })

  // Create a map of worker info by client ID for easy lookup
  const workersByClientId =
    poolStatus?.workers.reduce(
      (acc, worker) => {
        acc[worker.clientId] = worker
        return acc
      },
      {} as Record<number, (typeof poolStatus.workers)[0]>
    ) || {}

  return (
    <div className="space-y-6">
      {/* Pool Status Overview */}
      <PoolStatsCard poolStatus={poolStatus} />

      <Divider variant="dotted" />

      {/* Clients Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Split size={24} className="text-primary-text" />
          <h2 className="text-2xl font-semibold text-primary-text">Docker Clients</h2>
        </div>

        {clientsLoading ? (
          <div className="text-center py-12 text-muted-text">Loading clients...</div>
        ) : !clientsData || clientsData.length === 0 ? (
          <div className="text-center py-12 text-muted-text">
            No Docker clients configured. Add a client to get started.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {clientsData.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                workerInfo={client.id ? workersByClientId[client.id] : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider between Clients and Workers */}
      <Divider variant="dotted" />

      {/* Workers Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Hammer size={24} className="text-primary-text" />
          <h2 className="text-2xl font-semibold text-primary-text">Worker Pool</h2>
        </div>

        {poolLoading ? (
          <div className="text-center py-12 text-muted-text">Loading workers...</div>
        ) : !poolStatus?.workers || poolStatus.workers.length === 0 ? (
          <div className="text-center py-12 text-muted-text">
            No workers currently active in the pool.
          </div>
        ) : (
          <WorkersTable workers={poolStatus.workers} />
        )}
      </div>

      <Divider variant="dotted" />

      {/* Hosts Section */}
      <div className="">
        {hostsLoading ? (
          <div className="text-center py-12 text-muted-text">Loading hosts...</div>
        ) : (
          <HostsList hosts={hosts} />
        )}
      </div>
    </div>
  )
}
