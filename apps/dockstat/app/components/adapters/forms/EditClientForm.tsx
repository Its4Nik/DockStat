import { Button, Card, CardBody, CardHeader, Checkbox, Divider, Input } from "@dockstat/ui"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  Check,
  Clock,
  Cpu,
  Edit3,
  FolderOpen,
  Gauge,
  HeartPulse,
  Monitor,
  RefreshCw,
  Server,
  Settings,
  Terminal,
  Timer,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, EditClientFormProps } from "../types"
import { containerVariants, fadeInVariants, itemVariants } from "./consts"
import { FeatureToggle } from "./FeatureToggle"
import { FormField } from "./FormField"
import { Section } from "./Section"

export function EditClientForm({ client, worker, onClose }: EditClientFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"
  const previousState = useRef(fetcher.state)

  // Get options from worker if available
  const options = worker?.options

  // Basic options
  const [clientName, setClientName] = useState(client.clientName)
  const [enableMonitoring, setEnableMonitoring] = useState(options?.enableMonitoring ?? false)
  const [enableEventEmitter, setEnableEventEmitter] = useState(options?.enableEventEmitter ?? false)

  // Section visibility
  const [showApiOptions, setShowApiOptions] = useState(false)
  const [showMonitoringOptions, setShowMonitoringOptions] = useState(false)
  const [showExecOptions, setShowExecOptions] = useState(false)

  // Advanced (API) options
  const [defaultTimeout, setDefaultTimeout] = useState(options?.defaultTimeout?.toString() ?? "")
  const [retryAttempts, setRetryAttempts] = useState(options?.retryAttempts?.toString() ?? "")
  const [retryDelay, setRetryDelay] = useState(options?.retryDelay?.toString() ?? "")

  // Monitoring options
  const [healthCheckInterval, setHealthCheckInterval] = useState(
    options?.monitoringOptions?.healthCheckInterval?.toString() ?? ""
  )
  const [containerEventPollingInterval, setContainerEventPollingInterval] = useState(
    options?.monitoringOptions?.containerEventPollingInterval?.toString() ?? ""
  )
  const [hostMetricsInterval, setHostMetricsInterval] = useState(
    options?.monitoringOptions?.hostMetricsInterval?.toString() ?? ""
  )
  const [containerMetricsInterval, setContainerMetricsInterval] = useState(
    options?.monitoringOptions?.containerMetricsInterval?.toString() ?? ""
  )
  const [enableContainerEvents, setEnableContainerEvents] = useState(
    options?.monitoringOptions?.enableContainerEvents ?? false
  )
  const [enableHostMetrics, setEnableHostMetrics] = useState(
    options?.monitoringOptions?.enableHostMetrics ?? false
  )
  const [enableContainerMetrics, setEnableContainerMetrics] = useState(
    options?.monitoringOptions?.enableContainerMetrics ?? false
  )
  const [enableHealthChecks, setEnableHealthChecks] = useState(
    options?.monitoringOptions?.enableHealthChecks ?? false
  )
  const [monitoringRetryAttempts, setMonitoringRetryAttempts] = useState(
    options?.monitoringOptions?.retryAttempts?.toString() ?? ""
  )
  const [monitoringRetryDelay, setMonitoringRetryDelay] = useState(
    options?.monitoringOptions?.retryDelay?.toString() ?? ""
  )

  // Exec options
  const [workingDir, setWorkingDir] = useState(options?.execOptions?.workingDir ?? "")
  const [execEnv, setExecEnv] = useState(options?.execOptions?.env?.join(", ") ?? "")
  const [tty, setTty] = useState(options?.execOptions?.tty ?? false)

  // Validation
  const isFormValid = clientName.trim().length > 0

  // Handle fetcher response
  useEffect(() => {
    // Only trigger when transitioning from submitting/loading to idle
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Client updated", {
          description: fetcher.data.message || `Client "${clientName}" has been updated.`,
          duration: 5000,
        })
        onClose?.()
      } else {
        toast.error("Failed to update client", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, clientName, onClose])

  // Count active features
  const activeFeatureCount = [enableMonitoring, enableEventEmitter].filter(Boolean).length
  const activeMonitoringCount = [
    enableContainerEvents,
    enableHostMetrics,
    enableContainerMetrics,
    enableHealthChecks,
  ].filter(Boolean).length

  // Format uptime - value is in milliseconds
  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${mins}m`
    }
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    return `${days}d ${hours}h`
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <CardHeader className="pb-4">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-badge-primary-bg">
            <Edit3 size={22} className="text-badge-primary-text" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-primary-text">Edit Docker Client</h2>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  client.initialized
                    ? "bg-success/15 text-success"
                    : "bg-muted-text/15 text-muted-text"
                }`}
              >
                {client.initialized ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-muted-text mt-0.5">
              ID: {client.clientId} • Uptime: {formatUptime(client.uptime)}
            </p>
          </div>
        </motion.div>
      </CardHeader>

      <CardBody>
        <fetcher.Form method="post">
          {/* Hidden inputs */}
          <input type="hidden" name="intent" value="client:update" />
          <input type="hidden" name="clientId" value={client.clientId} />
          <input type="hidden" name="clientName" value={clientName} />
          <input type="hidden" name="defaultTimeout" value={defaultTimeout} />
          <input type="hidden" name="retryAttempts" value={retryAttempts} />
          <input type="hidden" name="retryDelay" value={retryDelay} />
          <input type="hidden" name="enableMonitoring" value={enableMonitoring.toString()} />
          <input type="hidden" name="enableEventEmitter" value={enableEventEmitter.toString()} />
          <input type="hidden" name="healthCheckInterval" value={healthCheckInterval} />
          <input
            type="hidden"
            name="containerEventPollingInterval"
            value={containerEventPollingInterval}
          />
          <input type="hidden" name="hostMetricsInterval" value={hostMetricsInterval} />
          <input type="hidden" name="containerMetricsInterval" value={containerMetricsInterval} />
          <input
            type="hidden"
            name="enableContainerEvents"
            value={enableContainerEvents.toString()}
          />
          <input type="hidden" name="enableHostMetrics" value={enableHostMetrics.toString()} />
          <input
            type="hidden"
            name="enableContainerMetrics"
            value={enableContainerMetrics.toString()}
          />
          <input type="hidden" name="enableHealthChecks" value={enableHealthChecks.toString()} />
          <input type="hidden" name="monitoringRetryAttempts" value={monitoringRetryAttempts} />
          <input type="hidden" name="monitoringRetryDelay" value={monitoringRetryDelay} />
          <input type="hidden" name="workingDir" value={workingDir} />
          <input type="hidden" name="execEnv" value={execEnv} />
          <input type="hidden" name="tty" value={tty.toString()} />

          <motion.div variants={containerVariants} className="space-y-5">
            {/* Status Overview */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-card-flat-bg">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-text">{client.hostsManaged}</div>
                  <div className="text-xs text-muted-text">Hosts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary-text">{client.activeStreams}</div>
                  <div className="text-xs text-muted-text">Streams</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${client.isMonitoring ? "text-success" : "text-muted-text"}`}
                  >
                    {client.isMonitoring ? "On" : "Off"}
                  </div>
                  <div className="text-xs text-muted-text">Monitoring</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${client.hasMonitoringManager ? "text-success" : "text-muted-text"}`}
                  >
                    {client.hasMonitoringManager ? "Yes" : "No"}
                  </div>
                  <div className="text-xs text-muted-text">Manager</div>
                </div>
              </div>
            </motion.div>

            <div className="flex flex-row justify-between gap-5">
              {/* Client Name - Primary Input */}
              <FormField
                label="Client Name"
                tooltip="A unique identifier for this Docker client connection"
                htmlFor="editClientNameInput"
                required
              >
                <div className="relative">
                  <Input
                    type="text"
                    variant="underline"
                    size="md"
                    placeholder="e.g., production-docker"
                    value={clientName}
                    onChange={setClientName}
                    className="pr-10"
                  />
                  <Server
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                  />
                </div>
              </FormField>

              {/* Quick Feature Toggles */}
              <motion.div variants={itemVariants}>
                <Card variant="flat" className="p-4 mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-accent" />
                      <span className="text-sm font-medium text-primary-text">Features</span>
                    </div>
                    <AnimatePresence mode="wait">
                      {activeFeatureCount > 0 && (
                        <motion.span
                          variants={fadeInVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/15 text-success"
                        >
                          {activeFeatureCount} enabled
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FeatureToggle
                      icon={<Monitor size={16} />}
                      label="Monitoring"
                      description="Real-time container & host metrics"
                      checked={enableMonitoring}
                      onChange={setEnableMonitoring}
                    />
                    <FeatureToggle
                      icon={<Activity size={16} />}
                      label="Event Emitter"
                      description="Container state change notifications"
                      checked={enableEventEmitter}
                      onChange={setEnableEventEmitter}
                    />
                  </div>
                </Card>
              </motion.div>
            </div>

            <Divider
              label={
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-muted-text" />
                  <span className="text-xs font-medium text-muted-text uppercase tracking-wide">
                    Advanced Configuration
                  </span>
                </div>
              }
            />

            {/* Advanced Settings Sections */}
            <motion.div variants={itemVariants} className="space-y-3">
              {/* API Options Section */}
              <Section
                icon={<Gauge size={18} />}
                title="API Options"
                description="Timeout and retry configuration"
                isOpen={showApiOptions}
                onToggle={() => setShowApiOptions(!showApiOptions)}
                badge={
                  defaultTimeout || retryAttempts ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-badge-primary-bg/15 text-badge-primary-outlined-text">
                      Configured
                    </span>
                  ) : null
                }
              >
                <Card variant="elevated" className="p-5 mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <FormField
                      label="Default Timeout"
                      tooltip="Default timeout in milliseconds for Docker API requests"
                      htmlFor="editDefaultTimeoutInput"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          size="md"
                          placeholder="30000"
                          value={defaultTimeout}
                          onChange={setDefaultTimeout}
                          className="pr-10"
                        />
                        <Clock
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Retry Attempts"
                      tooltip="Number of retry attempts for failed requests"
                      htmlFor="editRetryAttemptsInput"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          size="md"
                          placeholder="3"
                          value={retryAttempts}
                          onChange={setRetryAttempts}
                          className="pr-10"
                        />
                        <RefreshCw
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Retry Delay"
                      tooltip="Delay in milliseconds between retry attempts"
                      htmlFor="editRetryDelayInput"
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          size="md"
                          placeholder="1000"
                          value={retryDelay}
                          onChange={setRetryDelay}
                          className="pr-10"
                        />
                        <Timer
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                        />
                      </div>
                    </FormField>
                  </div>
                </Card>
              </Section>

              {/* Monitoring Options Section */}
              <Section
                icon={<HeartPulse size={18} />}
                title="Monitoring Options"
                description="Health checks and metrics collection"
                isOpen={showMonitoringOptions}
                onToggle={() => setShowMonitoringOptions(!showMonitoringOptions)}
                badge={
                  activeMonitoringCount > 0 ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/15 text-success">
                      {activeMonitoringCount} active
                    </span>
                  ) : null
                }
              >
                <Card variant="elevated" className="p-5 mt-3 space-y-5">
                  {/* Monitoring Feature Toggles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FeatureToggle
                      icon={<Zap size={14} />}
                      label="Container Events"
                      description="Track state changes"
                      checked={enableContainerEvents}
                      onChange={setEnableContainerEvents}
                    />
                    <FeatureToggle
                      icon={<Server size={14} />}
                      label="Host Metrics"
                      description="System resource usage"
                      checked={enableHostMetrics}
                      onChange={setEnableHostMetrics}
                    />
                    <FeatureToggle
                      icon={<Cpu size={14} />}
                      label="Container Metrics"
                      description="Per-container stats"
                      checked={enableContainerMetrics}
                      onChange={setEnableContainerMetrics}
                    />
                    <FeatureToggle
                      icon={<HeartPulse size={14} />}
                      label="Health Checks"
                      description="Connection monitoring"
                      checked={enableHealthChecks}
                      onChange={setEnableHealthChecks}
                    />
                  </div>

                  <Divider />

                  {/* Monitoring Intervals */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField
                      label="Health Check"
                      tooltip="Interval for health checks in ms"
                      htmlFor="editHealthCheckInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="30000"
                        value={healthCheckInterval}
                        onChange={setHealthCheckInterval}
                      />
                    </FormField>

                    <FormField
                      label="Event Polling"
                      tooltip="Container event polling interval in ms"
                      htmlFor="editEventPollingInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="5000"
                        value={containerEventPollingInterval}
                        onChange={setContainerEventPollingInterval}
                      />
                    </FormField>

                    <FormField
                      label="Host Metrics"
                      tooltip="Host metrics collection interval in ms"
                      htmlFor="editHostMetricsInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="10000"
                        value={hostMetricsInterval}
                        onChange={setHostMetricsInterval}
                      />
                    </FormField>

                    <FormField
                      label="Container Metrics"
                      tooltip="Container metrics collection interval in ms"
                      htmlFor="editContainerMetricsInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="5000"
                        value={containerMetricsInterval}
                        onChange={setContainerMetricsInterval}
                      />
                    </FormField>
                  </div>

                  {/* Monitoring Retry Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Monitoring Retry Attempts"
                      tooltip="Retry attempts for monitoring operations"
                      htmlFor="editMonitoringRetryAttemptsInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="3"
                        value={monitoringRetryAttempts}
                        onChange={setMonitoringRetryAttempts}
                      />
                    </FormField>

                    <FormField
                      label="Monitoring Retry Delay"
                      tooltip="Delay between monitoring retries in ms"
                      htmlFor="editMonitoringRetryDelayInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="1000"
                        value={monitoringRetryDelay}
                        onChange={setMonitoringRetryDelay}
                      />
                    </FormField>
                  </div>
                </Card>
              </Section>

              {/* Exec Options Section */}
              <Section
                icon={<Terminal size={18} />}
                title="Exec Options"
                description="Container command execution settings"
                isOpen={showExecOptions}
                onToggle={() => setShowExecOptions(!showExecOptions)}
                badge={
                  workingDir || tty ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-badge-primary-bg/15 text-badge-primary-outlined-text">
                      Configured
                    </span>
                  ) : null
                }
              >
                <Card variant="elevated" className="p-5 mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      label="Working Directory"
                      tooltip="Default working directory for exec commands"
                      htmlFor="editWorkingDirInput"
                    >
                      <div className="relative">
                        <Input
                          type="text"
                          size="md"
                          placeholder="/app"
                          value={workingDir}
                          onChange={setWorkingDir}
                          className="pr-10"
                        />
                        <FolderOpen
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Environment Variables"
                      tooltip="Comma-separated list of environment variables (e.g., NODE_ENV=production, DEBUG=true)"
                      htmlFor="editExecEnvInput"
                    >
                      <Input
                        type="text"
                        size="md"
                        placeholder="NODE_ENV=production, DEBUG=true"
                        value={execEnv}
                        onChange={setExecEnv}
                      />
                    </FormField>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-start gap-3">
                      <Checkbox checked={tty} onChange={setTty} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-primary-text">Allocate TTY</span>
                        <span className="text-xs text-muted-text">
                          Allocate a pseudo-TTY for interactive commands
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Section>
            </motion.div>

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
