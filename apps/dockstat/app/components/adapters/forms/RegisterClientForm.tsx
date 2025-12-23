import { Button, Card, CardBody, CardHeader, Checkbox, Divider, Input } from "@dockstat/ui"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  Check,
  Clock,
  Cpu,
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
import type { ActionResponse, RegisterClientFormProps } from "../types"
import { containerVariants, fadeInVariants, itemVariants } from "./consts"
import { FeatureToggle } from "./FeatureToggle"
import { FormField } from "./FormField"
import { Section } from "./Section"

export function RegisterClientForm({ onSuccess, onCancel }: RegisterClientFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"
  const previousState = useRef(fetcher.state)

  // Basic options
  const [clientName, setClientName] = useState("")
  const [enableMonitoring, setEnableMonitoring] = useState(false)
  const [enableEventEmitter, setEnableEventEmitter] = useState(false)

  // Section visibility
  const [showApiOptions, setShowApiOptions] = useState(false)
  const [showMonitoringOptions, setShowMonitoringOptions] = useState(false)
  const [showExecOptions, setShowExecOptions] = useState(false)

  // Advanced (API) options
  const [defaultTimeout, setDefaultTimeout] = useState("")
  const [retryAttempts, setRetryAttempts] = useState("")
  const [retryDelay, setRetryDelay] = useState("")

  // Monitoring options
  const [healthCheckInterval, setHealthCheckInterval] = useState("")
  const [containerEventPollingInterval, setContainerEventPollingInterval] = useState("")
  const [hostMetricsInterval, setHostMetricsInterval] = useState("")
  const [containerMetricsInterval, setContainerMetricsInterval] = useState("")
  const [enableContainerEvents, setEnableContainerEvents] = useState(false)
  const [enableHostMetrics, setEnableHostMetrics] = useState(false)
  const [enableContainerMetrics, setEnableContainerMetrics] = useState(false)
  const [enableHealthChecks, setEnableHealthChecks] = useState(false)
  const [monitoringRetryAttempts, setMonitoringRetryAttempts] = useState("")
  const [monitoringRetryDelay, setMonitoringRetryDelay] = useState("")

  // Exec options
  const [workingDir, setWorkingDir] = useState("")
  const [execEnv, setExecEnv] = useState("")
  const [tty, setTty] = useState(false)

  // Validation
  const isFormValid = clientName.trim().length > 0

  // Handle fetcher response
  useEffect(() => {
    // Only trigger when transitioning from submitting/loading to idle
    if (previousState.current !== "idle" && fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast.success("Client registered", {
          description:
            fetcher.data.message || `Client "${clientName}" has been registered successfully.`,
          duration: 5000,
        })
        // Reset form
        setClientName("")
        setDefaultTimeout("")
        setRetryAttempts("")
        setRetryDelay("")
        setEnableMonitoring(false)
        setEnableEventEmitter(false)
        setHealthCheckInterval("")
        setContainerEventPollingInterval("")
        setHostMetricsInterval("")
        setContainerMetricsInterval("")
        setEnableContainerEvents(false)
        setEnableHostMetrics(false)
        setEnableContainerMetrics(false)
        setEnableHealthChecks(false)
        setMonitoringRetryAttempts("")
        setMonitoringRetryDelay("")
        setWorkingDir("")
        setExecEnv("")
        setTty(false)
        onSuccess?.()
      } else {
        toast.error("Failed to register client", {
          description: fetcher.data.error || "An unexpected error occurred.",
          duration: 5000,
        })
      }
    }
    previousState.current = fetcher.state
  }, [fetcher.state, fetcher.data, clientName, onSuccess])

  // Count active features
  const activeFeatureCount = [enableMonitoring, enableEventEmitter].filter(Boolean).length
  const activeMonitoringCount = [
    enableContainerEvents,
    enableHostMetrics,
    enableContainerMetrics,
    enableHealthChecks,
  ].filter(Boolean).length

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <Card variant="default" size="md" className="w-full  mx-auto">
        <CardHeader className="pb-4">
          <motion.div variants={itemVariants} className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-badge-primary-bg">
              <Server size={22} className="text-badge-primary-text" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary-text">Register Docker Client</h2>
              <p className="text-sm text-muted-text mt-0.5">
                Configure a new Docker client connection
              </p>
            </div>
          </motion.div>
        </CardHeader>

        <CardBody>
          <fetcher.Form method="post">
            {/* Hidden inputs */}
            <input type="hidden" name="intent" value="client:register" />
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
              <div className="flex flex-row justify-between">
                {/* Client Name - Primary Input */}
                <FormField
                  label="Client Name"
                  tooltip="A unique identifier for this Docker client connection. Use something descriptive like 'production-server' or 'local-dev'."
                  htmlFor="clientNameInput"
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
                        <span className="text-sm font-medium text-primary-text">Quick Setup</span>
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
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-badge-primary-bg/15 text-badge-primary-text">
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
                        htmlFor="defaultTimeoutInput"
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
                        htmlFor="retryAttemptsInput"
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
                        htmlFor="retryDelayInput"
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
                  title="Monitoring"
                  description="Metrics collection and health checks"
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
                  <Card variant="elevated" className="p-5 mt-3 gap-4 flex flex-wrap">
                    {/* Intervals Grid */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={14} className="text-muted-text" />
                        <span className="text-xs font-medium text-muted-text uppercase tracking-wide">
                          Polling Intervals (ms)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="Health Check"
                          tooltip="Interval for health check pings (ms)"
                          htmlFor="healthCheckIntervalInput"
                        >
                          <Input
                            type="number"
                            size="md"
                            placeholder="30000"
                            value={healthCheckInterval}
                            onChange={setHealthCheckInterval}
                          />
                        </FormField>

                        <FormField
                          label="Event Polling"
                          tooltip="Interval for polling container events (ms)"
                          htmlFor="containerEventPollingInput"
                        >
                          <Input
                            type="number"
                            size="md"
                            placeholder="5000"
                            value={containerEventPollingInterval}
                            onChange={setContainerEventPollingInterval}
                          />
                        </FormField>

                        <FormField
                          label="Host Metrics"
                          tooltip="Interval for collecting host metrics (ms)"
                          htmlFor="hostMetricsIntervalInput"
                        >
                          <Input
                            type="number"
                            size="md"
                            placeholder="10000"
                            value={hostMetricsInterval}
                            onChange={setHostMetricsInterval}
                          />
                        </FormField>

                        <FormField
                          label="Container Metrics"
                          tooltip="Interval for collecting container metrics (ms)"
                          htmlFor="containerMetricsIntervalInput"
                        >
                          <Input
                            type="number"
                            size="md"
                            placeholder="5000"
                            value={containerMetricsInterval}
                            onChange={setContainerMetricsInterval}
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* Retry Settings */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <RefreshCw size={14} className="text-muted-text" />
                        <span className="text-xs font-medium text-muted-text uppercase tracking-wide">
                          Retry Settings
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          label="Retry Attempts"
                          tooltip="Retry attempts for monitoring operations"
                          htmlFor="monitoringRetryAttemptsInput"
                        >
                          <Input
                            type="number"
                            size="md"
                            placeholder="3"
                            value={monitoringRetryAttempts}
                            onChange={setMonitoringRetryAttempts}
                          />
                        </FormField>

                        <FormField
                          label="Retry Delay"
                          tooltip="Delay between monitoring retries (ms)"
                          htmlFor="monitoringRetryDelayInput"
                        >
                          <Input
                            type="number"
                            size="md"
                            placeholder="1000"
                            value={monitoringRetryDelay}
                            onChange={setMonitoringRetryDelay}
                          />
                        </FormField>
                      </div>
                    </div>

                    {/* Feature Toggles */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap size={14} className="text-muted-text" />
                        <span className="text-xs font-medium text-muted-text uppercase tracking-wide">
                          Enable Features
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            enableContainerEvents
                              ? "bg-success/10 border-success/30"
                              : "bg-card-flat-bg border-card-default-border hover:border-muted-text"
                          }`}
                          onClick={() => setEnableContainerEvents(!enableContainerEvents)}
                        >
                          <Checkbox
                            checked={enableContainerEvents}
                            onChange={setEnableContainerEvents}
                            size="sm"
                          />
                          <div>
                            <span className="text-sm text-primary-text">Container Events</span>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            enableHostMetrics
                              ? "bg-success/10 border-success/30"
                              : "bg-card-flat-bg border-card-default-border hover:border-muted-text"
                          }`}
                          onClick={() => setEnableHostMetrics(!enableHostMetrics)}
                        >
                          <Checkbox
                            checked={enableHostMetrics}
                            onChange={setEnableHostMetrics}
                            size="sm"
                          />
                          <div>
                            <span className="text-sm text-primary-text">Host Metrics</span>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            enableContainerMetrics
                              ? "bg-success/10 border-success/30"
                              : "bg-card-flat-bg border-card-default-border hover:border-muted-text"
                          }`}
                          onClick={() => setEnableContainerMetrics(!enableContainerMetrics)}
                        >
                          <Checkbox
                            checked={enableContainerMetrics}
                            onChange={setEnableContainerMetrics}
                            size="sm"
                          />
                          <div>
                            <span className="text-sm text-primary-text">Container Metrics</span>
                          </div>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            enableHealthChecks
                              ? "bg-success/10 border-success/30"
                              : "bg-card-flat-bg border-card-default-border hover:border-muted-text"
                          }`}
                          onClick={() => setEnableHealthChecks(!enableHealthChecks)}
                        >
                          <Checkbox
                            checked={enableHealthChecks}
                            onChange={setEnableHealthChecks}
                            size="sm"
                          />
                          <div>
                            <span className="text-sm text-primary-text">Health Checks</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </Card>
                </Section>

                {/* Exec Options Section */}
                <Section
                  icon={<Terminal size={18} />}
                  title="Exec Options"
                  description="Command execution settings"
                  isOpen={showExecOptions}
                  onToggle={() => setShowExecOptions(!showExecOptions)}
                  badge={
                    tty ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-badge-primary-bg/15 text-badge-primary-text">
                        TTY enabled
                      </span>
                    ) : null
                  }
                >
                  <Card variant="elevated" className="p-5 mt-3 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField
                        label="Working Directory"
                        tooltip="Default working directory for exec commands"
                        htmlFor="workingDirInput"
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
                        tooltip="Comma-separated environment variables (e.g., NODE_ENV=production,DEBUG=true)"
                        htmlFor="execEnvInput"
                      >
                        <div className="relative">
                          <Input
                            type="text"
                            size="md"
                            placeholder="KEY=value,KEY2=value2"
                            value={execEnv}
                            onChange={setExecEnv}
                            className="pr-10"
                          />
                          <Cpu
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                          />
                        </div>
                      </FormField>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex items-center justify-between gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        tty
                          ? "bg-badge-primary-bg/10 border-badge-primary-bg/30"
                          : "bg-card-flat-bg border-card-default-border hover:border-muted-text"
                      }`}
                      onClick={() => setTty(!tty)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg transition-colors ${
                            tty
                              ? "bg-badge-primary-bg/20 text-badge-primary-text"
                              : "bg-card-flat-bg text-muted-text"
                          }`}
                        >
                          <Terminal size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-primary-text">
                            Allocate TTY
                          </span>
                          <p className="text-xs text-muted-text">
                            Enable pseudo-terminal for interactive commands
                          </p>
                        </div>
                      </div>
                      <Checkbox checked={tty} onChange={setTty} size="sm" />
                    </motion.div>
                  </Card>
                </Section>
              </motion.div>

              {/* Help Text */}
              <motion.p variants={itemVariants} className="text-xs text-muted-text text-center">
                Tip: Advanced settings can be adjusted later. Start with the defaults and fine-tune
                as needed.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col-reverse sm:flex-row gap-3 pt-4"
              >
                {onCancel && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onCancel}
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
                        Registering...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Register Client
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
