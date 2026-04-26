import { Badge, Card, Divider, DockStatErrorCard } from "@dockstat/ui"
import { extractDockStatError } from "@dockstat/utils"
import { Hammer, Server, Split } from "lucide-react"
import { useContext } from "react"
import { ClientCard } from "@/components/clients/ClientCard"
import { HostsList } from "@/components/clients/HostsList"
import { PoolStatsCard } from "@/components/clients/PoolStatsCard"
import { WorkersTable } from "@/components/clients/WorkersTable"
import { EdenClientContext } from "@/contexts/edenClient"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function ClientsPage() {
  usePageHeading("Clients & Workers")

  const eden = useContext(EdenClientContext)

  const {
    data: clientsData,
    error: clientsError,
    isError: clientsIsError,
    isLoading: clientsIsLoading,
  } = eden.query({
    queryKey: ["fetchDockerClients"],
    route: api.docker.client.all({ stored: "true" }).get,
  })

  const {
    data: poolStatus,
    error: poolError,
    isError: poolIsError,
    isLoading: poolLoading,
  } = eden.query({
    queryKey: ["fetchPoolStatus"],
    route: api.docker.manager["pool-stats"].get,
  })

  const {
    data: hosts,
    error: hostsError,
    isError: hostsIsError,
    isLoading: hostsLoading,
  } = eden.query({
    queryKey: ["fetchHosts"],
    route: api.docker.hosts.get,
  })

  const clientsErrBody = clientsIsError ? extractDockStatError(clientsError) : undefined
  const poolErrBody = poolIsError ? extractDockStatError(poolError) : undefined
  const hostsErrBody = hostsIsError ? extractDockStatError(hostsError) : undefined

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
        <Card
          className="flex items-center gap-2 mb-4"
          size="sm"
          variant="flat"
        >
          <Split
            className="text-accent"
            size={24}
          />
          <h2 className="text-2xl font-semibold text-muted-text">Docker Clients</h2>
        </Card>

        {clientsIsLoading ? (
          <div className="text-center py-12 text-muted-text">Loading clients...</div>
        ) : clientsIsError ? (
          <DockStatErrorCard
            code={clientsErrBody?.code}
            description={
              clientsErrBody?.description ??
              clientsError?.message ??
              "Failed to load Docker clients"
            }
            reqId={clientsErrBody?.reqId}
            status={clientsErrBody?.status}
            title="Could not load clients"
          />
        ) : !clientsData || clientsData.length === 0 ? (
          <div className="text-center py-12 text-muted-text">
            No Docker clients configured. Add a client to get started.
          </div>
        ) : (
          <Card
            className="flex flex-wrap gap-4"
            variant="dark"
          >
            {clientsData.map((client) => (
              <ClientCard
                client={client}
                key={client.id}
                workerInfo={client.id ? workersByClientId[client.id] : undefined}
              />
            ))}
          </Card>
        )}
      </div>

      {/* Divider between Clients and Workers */}
      <Divider variant="dotted" />

      {/* Workers Section */}
      <div>
        <Card
          className="flex items-center gap-2 mb-4"
          size="sm"
          variant="flat"
        >
          <Hammer
            className="text-accent"
            size={24}
          />
          <h2 className="text-2xl font-semibold text-muted-text">Worker Pool</h2>
        </Card>

        {poolLoading ? (
          <div className="text-center py-12 text-muted-text">Loading workers...</div>
        ) : poolIsError ? (
          <DockStatErrorCard
            code={poolErrBody?.code}
            description={
              poolErrBody?.description ?? poolError?.message ?? "Failed to load worker pool"
            }
            reqId={poolErrBody?.reqId}
            status={poolErrBody?.status}
            title="Could not load workers"
          />
        ) : !poolStatus?.workers || poolStatus.workers.length === 0 ? (
          <div className="text-center py-12 text-muted-text">
            No workers currently active in the pool.
          </div>
        ) : (
          <Card variant="dark">
            <WorkersTable workers={poolStatus.workers} />
          </Card>
        )}
      </div>

      <Divider variant="dotted" />

      {/* Hosts Section */}
      <div>
        <Card
          className="flex justify-between justify-centergap-2 mb-4"
          size="sm"
          variant="flat"
        >
          <div className="flex items-center gap-2">
            <Server
              className="text-accent"
              size={24}
            />
            <h2 className="text-2xl font-semibold text-muted-text">Docker Hosts</h2>
          </div>
          {hosts && (
            <Badge
              size="sm"
              variant="primary"
            >
              {hosts.length} {hosts.length === 1 ? "Host" : "Hosts"}
            </Badge>
          )}
        </Card>

        {hostsLoading ? (
          <div className="text-center py-12 text-muted-text">Loading hosts...</div>
        ) : hostsIsError ? (
          <DockStatErrorCard
            code={hostsErrBody?.code}
            description={
              hostsErrBody?.description ?? hostsError?.message ?? "Failed to load Docker hosts"
            }
            reqId={hostsErrBody?.reqId}
            status={hostsErrBody?.status}
            title="Could not load hosts"
          />
        ) : (
          <HostsList hosts={hosts} />
        )}
      </div>
    </div>
  )
}
