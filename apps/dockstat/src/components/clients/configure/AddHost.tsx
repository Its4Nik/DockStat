import { Button, Card, CardBody, Input, Toggle } from "@dockstat/ui"
import { useState } from "react"
import { useDockerHostMutations } from "@/hooks/mutations"

type hostToAdd = {
  secure: boolean
  name: string
  hostname: string
  clientId: number
  port: number
}

export function AddHost({
  registeredClients,
}: {
  registeredClients: { clientName: string; clientId: number }[]
}) {
  const { createHostMutation } = useDockerHostMutations()
  const [formData, setFormData] = useState<hostToAdd>({
    clientId: registeredClients[0]?.clientId ?? 0,
    hostname: "",
    name: "",
    port: 2375,
    secure: false,
  })

  const handleAddHost = async () => {
    if (!formData.name || !formData.hostname) return
    await createHostMutation.mutateAsync(formData)
  }

  const updateField = (field: keyof hostToAdd, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="mx-auto max-w-6xl py-4">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Connection Details */}
        <div className="space-y-6">
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-text">
              Host Details
            </h3>
            <Card variant="dark">
              <CardBody className="space-y-5">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Display Name</span>
                  <Input
                    onChange={(v) => updateField("name", v)}
                    placeholder="e.g. Primary Node"
                    value={formData.name}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Hostname / IP</span>
                  <Input
                    onChange={(v) => updateField("hostname", v)}
                    placeholder="192.168.1.10"
                    value={formData.hostname}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Port</span>
                    <Input
                      onChange={(v) => updateField("port", parseInt(v, 10))}
                      type="number"
                      value={formData.port.toString()}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <Toggle
                      checked={formData.secure}
                      label="Secure (TLS)"
                      onChange={(v) => updateField("secure", v)}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </section>
        </div>

        {/* Right Column: Assignment & Actions */}
        <div className="space-y-6">
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-text">
              Assignment
            </h3>
            <Card variant="dark">
              <CardBody className="space-y-5">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Target Client ID</span>
                  <select
                    className="w-full rounded-md border border-accent/20 bg-background p-2 text-sm"
                    onChange={(e) => updateField("clientId", Number.parseInt(e.target.value, 10))}
                    value={formData.clientId}
                  >
                    {registeredClients.map((c) => (
                      <option
                        key={c.clientId}
                        value={c.clientId}
                      >
                        Client: {c.clientName} ({c.clientId})
                      </option>
                    ))}
                    {registeredClients.length === 0 && (
                      <option disabled>No clients available</option>
                    )}
                  </select>
                </div>
                <p className="text-xs text-muted-text">
                  This host will be managed by the selected Docker client. Ensure the client can
                  reach the host over the network.
                </p>
              </CardBody>
            </Card>
          </section>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              className="w-full"
              disabled={
                !formData.name ||
                !formData.hostname ||
                createHostMutation.isPending ||
                registeredClients.length === 0
              }
              onClick={handleAddHost}
              size="lg"
            >
              {createHostMutation.isPending ? "Connecting..." : "Add Remote Host"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
