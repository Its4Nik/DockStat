import { Button, Card, CardBody, CardHeader, Toggle } from "@dockstat/ui"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, AddHostFormProps } from "../types"

export function AddHostForm({ clients, onClose }: AddHostFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"

  const [clientId, setClientId] = useState<string>(clients[0]?.clientId.toString() ?? "")
  const [hostname, setHostname] = useState("")
  const [name, setName] = useState("")
  const [port, setPort] = useState("2375")
  const [secure, setSecure] = useState(false)

  // Handle fetcher response for toast notifications
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Host added", {
          description: fetcher.data.message || `Host "${name}" has been added successfully.`,
          duration: 5000,
        })
        // Reset form
        setHostname("")
        setName("")
        setPort(secure ? "2376" : "2375")
        onClose?.()
      } else {
        toast.error("Failed to add host", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
  }, [fetcher.state, fetcher.data, name, secure, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!clientId || !hostname || !name) return

    fetcher.submit(
      {
        intent: "host:add",
        clientId,
        hostname,
        name,
        port,
        secure: secure.toString(),
      },
      { method: "post" }
    )
  }

  if (clients.length === 0) {
    return (
      <Card variant="outlined" size="sm">
        <CardBody className="text-center text-muted-text">
          Register a client first before adding hosts
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="default" size="sm" className="w-full max-w-md">
      <CardHeader className="text-lg flex items-center gap-2">
        <Plus size={20} />
        <span>Add Host</span>
      </CardHeader>
      <CardBody>
        <fetcher.Form method="post" onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="intent" value="host:add" />

          <div>
            <label
              htmlFor="host-client-select"
              className="block text-sm font-medium text-secondary-text mb-1"
            >
              Docker Client
            </label>
            <select
              id="host-client-select"
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-card-default-border bg-main-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-badge-primary-bg"
              required
            >
              {clients.map((client) => (
                <option key={client.clientId} value={client.clientId}>
                  {client.clientName} (ID: {client.clientId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="host-name-input"
              className="block text-sm font-medium text-secondary-text mb-1"
            >
              Display Name
            </label>
            <input
              id="host-name-input"
              name="name"
              type="text"
              placeholder="e.g., Production Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            />
          </div>

          <div>
            <label
              htmlFor="host-hostname-input"
              className="block text-sm font-medium text-secondary-text mb-1"
            >
              Hostname / IP Address
            </label>
            <input
              id="host-hostname-input"
              name="hostname"
              type="text"
              placeholder="e.g., 192.168.1.100 or docker.example.com"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="host-port-input"
                className="block text-sm font-medium text-secondary-text mb-1"
              >
                Port
              </label>
              <input
                id="host-port-input"
                name="port"
                type="number"
                placeholder="2375"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-secondary-text mb-1">TLS/SSL</span>
              <div className="flex items-center gap-2 h-10">
                <Toggle
                  checked={secure}
                  onChange={(checked) => {
                    setSecure(checked)
                    setPort(checked ? "2376" : "2375")
                  }}
                  label={secure ? "Enabled" : "Disabled"}
                />
                <span className="text-sm text-muted-text">{secure ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Add Host"}
            </Button>
            {onClose && (
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </fetcher.Form>
      </CardBody>
    </Card>
  )
}
