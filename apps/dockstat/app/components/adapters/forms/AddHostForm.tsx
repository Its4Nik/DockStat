import { Button, Card, CardBody, CardHeader, Input, Toggle } from "@dockstat/ui"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  Check,
  Globe,
  HardDrive,
  Lock,
  Network,
  Plus,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, AddHostFormProps } from "../types"
import { containerVariants, fadeInVariants, itemVariants } from "./consts"
import { FormField } from "./FormField"
import { Section } from "./Section"

export function AddHostForm({ clients, onClose }: AddHostFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"

  // Form state
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [clientId, setClientId] = useState<string>(clients[0]?.clientId.toString() ?? "")
  const [hostname, setHostname] = useState("")
  const [name, setName] = useState("")
  const [port, setPort] = useState("2375")
  const [secure, setSecure] = useState(false)

  // Validation
  const isFormValid = clientId && hostname.trim() && name.trim()

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Host added", {
          description: fetcher.data.message || `Host "${name}" has been added successfully.`,
          duration: 5000,
        })
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
    if (!isFormValid) return

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

  // Empty state
  if (clients.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card variant="outlined" size="md" className="w-full max-w-md mx-auto">
          <CardBody className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="p-4 rounded-full bg-card-flat-bg w-fit mx-auto mb-4"
            >
              <Server size={32} className="text-muted-text" />
            </motion.div>
            <h3 className="text-lg font-semibold text-primary-text mb-2">No Clients Available</h3>
            <p className="text-sm text-muted-text max-w-xs mx-auto">
              Register a Docker client first before adding hosts to manage.
            </p>
          </CardBody>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <Card variant="default" size="md" className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success/15">
              <Plus size={22} className="text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">Add Docker Host</h2>
              <p className="text-sm text-muted-text mt-0.5">Connect to a remote Docker daemon</p>
            </div>
          </motion.div>
        </CardHeader>

        <CardBody className="pt-0">
          <fetcher.Form method="post" onSubmit={handleSubmit}>
            {/* Hidden inputs */}
            <input type="hidden" name="intent" value="host:add" />
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="hostname" value={hostname} />
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="port" value={port} />
            <input type="hidden" name="secure" value={secure.toString()} />

            <motion.div variants={containerVariants} className="space-y-5">
              {/* Primary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  label="Docker Client"
                  tooltip="Select the Docker client that will manage this host connection"
                  htmlFor="host-client-select"
                  required
                >
                  <div className="relative">
                    <select
                      id="host-client-select"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-badge-primary-bg/50 focus:border-badge-primary-bg appearance-none cursor-pointer transition-all"
                      required
                    >
                      {clients.map((client) => (
                        <option key={client.clientId} value={client.clientId}>
                          {client.clientName}
                        </option>
                      ))}
                    </select>
                    <HardDrive
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Display Name"
                  tooltip="A friendly name to identify this host in the dashboard"
                  htmlFor="host-name-input"
                  required
                >
                  <div className="relative">
                    <Input
                      type="text"
                      size="md"
                      placeholder="e.g., Production Server"
                      value={name}
                      onChange={setName}
                      className="pr-10"
                    />
                    <Server
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                    />
                  </div>
                </FormField>
              </div>

              {/* Security Toggle Card */}
              <motion.div variants={itemVariants}>
                <Card variant="flat" className="p-4 mx-auto">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{
                          backgroundColor: secure
                            ? "rgba(34, 197, 94, 0.15)"
                            : "rgba(148, 163, 184, 0.15)",
                        }}
                        transition={{ duration: 0.2 }}
                        className="p-2 rounded-lg"
                      >
                        <motion.div initial={false} animate={{ rotate: secure ? 0 : 0 }}>
                          {secure ? (
                            <ShieldCheck size={20} className="text-success" />
                          ) : (
                            <Shield size={20} className="text-muted-text" />
                          )}
                        </motion.div>
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary-text">TLS/SSL Encryption</span>
                          <AnimatePresence mode="wait">
                            {secure && (
                              <motion.span
                                variants={fadeInVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/15 text-success"
                              >
                                Secure
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                        <p className="text-xs text-muted-text mt-0.5">
                          {secure
                            ? "Connection encrypted with TLS certificates"
                            : "Unencrypted connection (not recommended for production)"}
                        </p>
                      </div>
                    </div>
                    <Toggle
                      checked={secure}
                      onChange={(checked) => {
                        setSecure(checked)
                        setPort(checked ? "2376" : "2375")
                      }}
                      size="md"
                    />
                  </div>
                </Card>
              </motion.div>

              {/* Security Warning */}
              <AnimatePresence>
                {!secure && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-badge-warning-outlined-border bg-card-elevated-bg">
                      <AlertTriangle
                        size={18}
                        className=" text-badge-warning-outlined-border mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-warning">Security Notice</p>
                        <p className="text-xs text-warning/80 mt-0.5">
                          Unencrypted connections expose Docker API traffic. Enable TLS for secure
                          communication in production environments.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Advanced Settings Section */}
              <Section
                icon={<Network size={18} />}
                title="Connection Settings"
                description="Configure hostname, port, and network options"
                isOpen={showAdvanced}
                onToggle={() => setShowAdvanced(!showAdvanced)}
                badge={
                  hostname && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-badge-primary-bg/15 text-badge-primary-text">
                      {hostname}:{port}
                    </span>
                  )
                }
              >
                <Card variant="elevated" className="p-5 mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      label="Hostname / IP Address"
                      tooltip="The network address of the Docker host (IP address or fully qualified domain name)"
                      htmlFor="host-hostname-input"
                      required
                    >
                      <div className="relative">
                        <Input
                          type="text"
                          size="md"
                          placeholder="e.g., 192.168.1.100"
                          value={hostname}
                          onChange={setHostname}
                          className="pr-10"
                        />
                        <Globe
                          size={16}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Port"
                      tooltip="Docker daemon port (2375 for unencrypted, 2376 for TLS)"
                      htmlFor="host-port-input"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          size="md"
                          placeholder={secure ? "2376" : "2375"}
                          value={port}
                          onChange={setPort}
                          className="pr-10"
                        />
                        <Lock
                          size={16}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                            secure ? "text-success" : "text-muted-text"
                          }`}
                        />
                      </div>
                    </FormField>
                  </div>

                  {/* Connection Preview */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-5 p-3 rounded-lg bg-card-flat-bg border border-card-default-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${secure ? "bg-success" : "bg-warning"}`}
                        />
                        <span className="text-sm text-secondary-text">Connection URL</span>
                      </div>
                      <code className="text-sm font-mono text-primary-text">
                        {secure ? "https" : "http"}://{hostname || "hostname"}:{port}
                      </code>
                    </div>
                  </motion.div>
                </Card>
              </Section>

              {/* Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col-reverse sm:flex-row gap-3 pt-4"
              >
                {onClose && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onClose}
                    className="sm:flex-1"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || !isFormValid}
                  className="sm:flex-2"
                >
                  <motion.span
                    className="flex items-center justify-center gap-2"
                    initial={false}
                    animate={{ opacity: 1 }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Adding Host...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Add Host
                      </>
                    )}
                  </motion.span>
                </Button>
              </motion.div>
            </motion.div>
          </fetcher.Form>
        </CardBody>
      </Card>
    </motion.div>
  )
}
