import { Button, Card, CardBody, CardHeader, Divider, Input, Toggle } from "@dockstat/ui"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  Check,
  Edit3,
  Globe,
  Lock,
  Network,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, EditHostFormProps } from "../types"
import { containerVariants, fadeInVariants, itemVariants } from "./consts"
import { FormField } from "./FormField"
import { Section } from "./Section"

export function EditHostForm({ host, clientName, onClose }: EditHostFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"
  const previousState = useRef(fetcher.state)

  // Form state - initialized from host data
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hostname, setHostname] = useState(host.host ?? "")
  const [name, setName] = useState(host.name)
  const [port, setPort] = useState(String(host.port ?? 2375))
  const [secure, setSecure] = useState(host.secure ?? false)

  // Validation
  const isFormValid = hostname.trim() && name.trim()

  // Track if form has changes
  const hasChanges =
    hostname !== (host.host ?? "") ||
    name !== host.name ||
    port !== String(host.port ?? 2375) ||
    secure !== (host.secure ?? false)

  // Handle fetcher response
  useEffect(() => {
    // Only trigger when transitioning from submitting/loading to idle
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Host updated", {
          description: fetcher.data.message || `Host "${name}" has been updated successfully.`,
          duration: 5000,
        })
        onClose?.()
      } else {
        toast.error("Failed to update host", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, name, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !hasChanges) return

    fetcher.submit(
      {
        intent: "host:update",
        clientId: String(host.clientId),
        hostId: String(host.id),
        host: hostname,
        name,
        port,
        secure: secure.toString(),
      },
      { method: "post" }
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <CardHeader className="pb-4">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-badge-primary-bg">
            <Edit3 size={22} className="text-badge-primary-text" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary-text">Edit Docker Host</h2>
            <p className="text-sm text-muted-text mt-0.5">
              Modify host connection settings
              {clientName && <span className="text-accent"> • {clientName}</span>}
            </p>
          </div>
        </motion.div>
      </CardHeader>

      <CardBody>
        <fetcher.Form method="post" onSubmit={handleSubmit}>
          {/* Hidden inputs */}
          <input type="hidden" name="intent" value="host:update" />
          <input type="hidden" name="clientId" value={host.clientId} />
          <input type="hidden" name="hostId" value={host.id} />
          <input type="hidden" name="host" value={hostname} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="port" value={port} />
          <input type="hidden" name="secure" value={secure.toString()} />

          <motion.div variants={containerVariants} className="space-y-5">
            <div className="flex flex-col md:flex-row justify-between gap-5">
              {/* Display Name - Primary Input */}
              <FormField
                label="Display Name"
                tooltip="A friendly name to identify this host in the dashboard"
                htmlFor="edit-host-name-input"
                required
              >
                <div className="relative">
                  <Input
                    type="text"
                    variant="underline"
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

              {/* Quick Setup - Security Toggle */}
              <motion.div variants={itemVariants}>
                <Card variant="flat" className="p-4 mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-accent" />
                      <span className="text-sm font-medium text-primary-text">Security</span>
                    </div>
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
                            <ShieldCheck size={18} className="text-success" />
                          ) : (
                            <Shield size={18} className="text-muted-text" />
                          )}
                        </motion.div>
                      </motion.div>
                      <div>
                        <span className="text-sm font-medium text-primary-text">
                          TLS/SSL Encryption
                        </span>
                        <p className="text-xs text-muted-text mt-0.5">
                          {secure ? "Encrypted connection" : "Unencrypted"}
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
            </div>

            {/* Security Warning */}
            <AnimatePresence>
              {!secure && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start gap-3 flex-wrap p-3 rounded-lg bg-warning/10 border border-badge-warning-outlined-border bg-card-elevated-bg">
                    <AlertTriangle
                      size={18}
                      className="text-badge-warning-outlined-border mt-0.5 shrink-0"
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

            <Divider
              label={
                <div className="flex items-center gap-2">
                  <Network size={14} className="text-muted-text" />
                  <span className="text-xs font-medium text-muted-text uppercase tracking-wide">
                    Connection Settings
                  </span>
                </div>
              }
            />

            {/* Connection Settings Section */}
            <motion.div variants={itemVariants} className="space-y-3">
              <Section
                icon={<Network size={18} />}
                title="Connection Settings"
                description="Configure hostname and port"
                isOpen={showAdvanced}
                onToggle={() => setShowAdvanced(!showAdvanced)}
                badge={
                  hostname ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-badge-primary-bg/15 text-badge-primary-outlined-text">
                      {hostname}:{port}
                    </span>
                  ) : null
                }
              >
                <Card variant="elevated" className="p-5 mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      label="Hostname / IP Address"
                      tooltip="The network address of the Docker host (IP address or fully qualified domain name)"
                      htmlFor="edit-host-hostname-input"
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
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Port"
                      tooltip="Docker daemon port (2375 for unencrypted, 2376 for TLS)"
                      htmlFor="edit-host-port-input"
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
                          size={14}
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
            </motion.div>

            {/* Changes indicator */}
            <AnimatePresence>
              {hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sm text-accent"
                >
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span>Unsaved changes</span>
                </motion.div>
              )}
            </AnimatePresence>

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
                disabled={isSubmitting || !isFormValid || !hasChanges}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Changes
                    </>
                  )}
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        </fetcher.Form>
      </CardBody>
    </motion.div>
  )
}
