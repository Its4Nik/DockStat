import { Card, CardBody, Divider, Slides } from "@dockstat/ui"
import { eden } from "@dockstat/utils/react"
import { Plus, Split } from "lucide-react"
import { ClientCard, HostsList } from "@/components/clients"
import { AddClient } from "@/components/clients/configure/AddClient"
import { AddHost } from "@/components/clients/configure/AddHost"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function ConfigureClientsPage() {
  usePageHeading("Configure Clients & Hosts")

  const { data: clientsData } = eden.useEdenQuery({
    queryKey: ["fetchDockerClients"],
    route: api.docker.client.all({ stored: "true" }).get,
  })

  const { data: poolStatus } = eden.useEdenQuery({
    queryKey: ["fetchPoolStatus"],
    route: api.docker.manager["pool-stats"].get,
  })

  const { data: hosts } = eden.useEdenQuery({
    queryKey: ["fetchHosts"],
    route: api.docker.hosts.get,
  })

  const workersByClientId =
    poolStatus?.workers.reduce(
      (acc, worker) => {
        acc[worker.clientId] = worker
        return acc
      },
      {} as Record<number, (typeof poolStatus.workers)[0]>
    ) || {}

  return (
    <div className="flex flex-col gap-6 p-4">
      <Slides
        buttonPosition="right"
        connected
        description="Manage your infrastructure connections"
        header="Administration"
        hideable
      >
        {{
          "Add Client": <AddClient />,
          "Add Host": (
            <AddHost
              registeredClients={(clientsData || []).flatMap((c) => {
                return { clientId: c.id, clientName: c.name }
              })}
            />
          ),
        }}
      </Slides>

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

        <Card
          className="flex flex-wrap gap-4"
          variant="dark"
        >
          {(clientsData || []).map((client) => (
            <ClientCard
              client={client}
              key={client.id}
              workerInfo={client.id ? workersByClientId[client.id] : undefined}
            />
          ))}
        </Card>
      </div>

      {(!clientsData || clientsData.length === 0) && (
        <Card
          className="border-dashed transition-all hover:border-primary/50"
          hoverable
          variant="outlined"
        >
          <CardBody className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30 border border-dashed">
              <Plus
                className="text-muted-text"
                size={24}
              />
            </div>
            <div className="text-center">
              <p className="font-medium">No Clients Found</p>
              <p className="text-xs text-muted-text">
                Get started by adding a Docker client above.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <Divider />

      <div>
        <HostsList hosts={hosts} />
      </div>
    </div>
  )
}
