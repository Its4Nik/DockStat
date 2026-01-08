import { addHost } from "@Actions"
import { Button, Card, CardBody, Input, Toggle } from "@dockstat/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

type hostToAdd = {
  secure: boolean
  name: string
  hostname: string
  clientId: number
  port: number
}

export function AddHost({ registeredClients }: { registeredClients: number[] }) {
  const qc = useQueryClient()
  const [formData, setFormData] = useState<hostToAdd>({
    secure: false,
    name: "",
    hostname: "",
    clientId: registeredClients[0] || 0,
    port: 2375,
  })

  const addHostMutation = useMutation({
    mutationKey: ["addHost"],
    mutationFn: addHost,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["fetchHosts"] })
      setFormData((p) => ({ ...p, name: "", hostname: "" }))
    },
  })

  const handleAddHost = async () => {
    if (!formData.name || !formData.hostname) return
    await addHostMutation.mutateAsync(formData)
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
                    value={formData.name}
                    onChange={(v) => updateField("name", v)}
                    placeholder="e.g. Primary Node"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Hostname / IP</span>
                  <Input
                    value={formData.hostname}
                    onChange={(v) => updateField("hostname", v)}
                    placeholder="192.168.1.10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium">Port</span>
                    <Input
                      type="number"
                      value={formData.port.toString()}
                      onChange={(v) => updateField("port", parseInt(v, 10))}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-1">
                    <Toggle
                      label="Secure (TLS)"
                      checked={formData.secure}
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
                    value={formData.clientId}
                    onChange={(e) => updateField("clientId", Number.parseInt(e.target.value, 10))}
                  >
                    {registeredClients.map((id) => (
                      <option key={id} value={id}>
                        Client ID: {id}
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
              size="lg"
              className="w-full"
              onClick={handleAddHost}
              disabled={
                !formData.name ||
                !formData.hostname ||
                addHostMutation.isPending ||
                registeredClients.length === 0
              }
            >
              {addHostMutation.isPending ? "Connecting..." : "Add Remote Host"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
