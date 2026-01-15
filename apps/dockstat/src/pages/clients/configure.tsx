import { Card, CardBody, Divider, Slides } from "@dockstat/ui"
import { Plus, Split } from "lucide-react"
import { ClientCard, HostsList } from "@/components/clients"
import { AddClient } from "@/components/clients/configure/AddClient"
import { AddHost } from "@/components/clients/configure/AddHost"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { usePageHeading } from "@/hooks/useHeading"
import { api } from "@/lib/api"

export default function ConfigureClientsPage() {
  usePageHeading("Configure Clients & Hosts")

  const { data: clientsData } = useEdenQuery({
    route: api.docker.client.all({ stored: "true" }).get,
    queryKey: ["fetchDockerClients"],
  })

  const { data: poolStatus } = useEdenQuery({
    route: api.docker.manager["pool-stats"].get,
    queryKey: ["fetchPoolStatus"],
  })

  const { data: hosts } = useEdenQuery({
    route: api.docker.hosts.get,
    queryKey: ["fetchHosts"],
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
        connected
        buttonPosition="right"
        hideable
        header="Administration"
        description="Manage your infrastructure connections"
      >
        {{
          "Add Client": <AddClient />,
          "Add Host": <AddHost registeredClients={(clientsData || []).flatMap((c) => c.id)} />,
        }}
      </Slides>

      <div>
        <Card size="sm" variant="flat" className="flex items-center gap-2 mb-4">
          <Split size={24} className="text-accent" />
          <h2 className="text-2xl font-semibold text-muted-text">Docker Clients</h2>
        </Card>

        <Card variant="dark" className="flex flex-wrap gap-4">
          {(clientsData || []).map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              workerInfo={client.id ? workersByClientId[client.id] : undefined}
            />
          ))}
        </Card>
      </div>

      {(!clientsData || clientsData.length === 0) && (
        <Card
          variant="outlined"
          hoverable
          className="border-dashed transition-all hover:border-primary/50"
        >
          <CardBody className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/30 border border-dashed">
              <Plus size={24} className="text-muted-text" />
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
