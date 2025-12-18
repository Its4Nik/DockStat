import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  HoverBubble,
  Input,
  Toggle,
} from "@dockstat/ui"
import { Globe, HardDrive, Info, Lock, Plus, RefreshCw, Server } from "lucide-react"
import { useEffect, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, AddHostFormProps } from "../types"

interface FormFieldProps {
  label: string
  tooltip: string
  children: React.ReactNode
  htmlFor?: string
}

function FormField({ label, tooltip, children, htmlFor }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-secondary-text">
          {label}
        </label>
        <HoverBubble label={tooltip} position="right">
          <Info
            size={14}
            className="text-muted-text hover:text-secondary-text cursor-help transition-colors"
          />
        </HoverBubble>
      </div>
      {children}
    </div>
  )
}

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
      <Card variant="outlined" size="md" className="w-full max-w-md mx-auto">
        <CardBody className="text-center py-8">
          <div className="p-4 rounded-full bg-card-flat-bg w-fit mx-auto mb-4">
            <Server size={32} className="text-muted-text" />
          </div>
          <h3 className="text-lg font-medium text-primary-text mb-2">No Clients Available</h3>
          <p className="text-sm text-muted-text">
            Register a Docker client first before adding hosts.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="default" size="md" className="w-full max-w-md mx-auto">
      <CardHeader className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-success/20">
          <Plus size={20} className="text-success" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-text">Add Docker Host</h2>
          <p className="text-xs text-muted-text">Connect to a remote Docker daemon</p>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <fetcher.Form method="post" onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="intent" value="host:add" />

          {/* Client Selection */}
          <FormField
            label="Docker Client"
            tooltip="Select the Docker client that will manage this host connection"
            htmlFor="host-client-select"
          >
            <div className="relative">
              <select
                id="host-client-select"
                name="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-badge-primary-bg appearance-none cursor-pointer"
                required
              >
                {clients.map((client) => (
                  <option key={client.clientId} value={client.clientId}>
                    {client.clientName} (ID: {client.clientId})
                  </option>
                ))}
              </select>
              <HardDrive
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
              />
            </div>
          </FormField>

          <Divider className="my-4" />

          {/* Host Details */}
          <FormField
            label="Display Name"
            tooltip="A friendly name to identify this host in the dashboard"
            htmlFor="host-name-input"
          >
            <div className="relative">
              <Input
                type="text"
                size="md"
                placeholder="e.g., Production Server"
                value={name}
                onChange={setName}
              />
              <Server
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
              />
            </div>
          </FormField>

          <FormField
            label="Hostname / IP Address"
            tooltip="The network address of the Docker host (IP address or fully qualified domain name)"
            htmlFor="host-hostname-input"
          >
            <div className="relative">
              <Input
                type="text"
                size="md"
                placeholder="e.g., 192.168.1.100 or docker.example.com"
                value={hostname}
                onChange={setHostname}
              />
              <Globe
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
              />
            </div>
          </FormField>

          {/* Port and Security Row */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Port"
              tooltip="Docker daemon port (2375 for unencrypted, 2376 for TLS)"
              htmlFor="host-port-input"
            >
              <Input
                type="number"
                size="md"
                placeholder={secure ? "2376" : "2375"}
                value={port}
                onChange={setPort}
              />
            </FormField>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-secondary-text">TLS/SSL</span>
                <HoverBubble
                  label="Enable secure TLS connection to the Docker daemon. Requires proper certificate configuration on the host."
                  position="top"
                >
                  <Info
                    size={14}
                    className="text-muted-text hover:text-secondary-text cursor-help transition-colors"
                  />
                </HoverBubble>
              </div>
              <div
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                  secure
                    ? "bg-success/10 border-success/30"
                    : "bg-card-flat-bg border-card-default-border"
                }`}
              >
                <Toggle
                  checked={secure}
                  onChange={(checked) => {
                    setSecure(checked)
                    setPort(checked ? "2376" : "2375")
                  }}
                  size="sm"
                />
                <div className="flex items-center gap-1.5">
                  <Lock size={14} className={secure ? "text-success" : "text-muted-text"} />
                  <span className={`text-sm ${secure ? "text-success" : "text-muted-text"}`}>
                    {secure ? "Secure" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          {!secure && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <Info size={16} className="text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">
                Unencrypted connections are not recommended for production. Consider enabling TLS
                for secure communication.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !hostname.trim() || !name.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Adding...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Add Host
                </span>
              )}
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
