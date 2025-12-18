import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Divider,
  HoverBubble,
  Input,
  Toggle,
} from "@dockstat/ui"
import {
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  Cog,
  Info,
  Monitor,
  RefreshCw,
  Server,
  Terminal,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, RegisterClientFormProps } from "../types"

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  isOpen: boolean
  onToggle: () => void
  description?: string
}

function SectionHeader({ icon, title, isOpen, onToggle, description }: SectionHeaderProps) {
  return (
    <Card hoverable onClick={onToggle} size="sm" variant="outlined">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-badge-primary-bg/20 text-badge-primary-text">{icon}</div>
        <div className="text-left">
          <span className="font-medium text-primary-text">{title}</span>
          {description && <p className="text-xs text-muted-text mt-0.5">{description}</p>}
        </div>
        <div className="text-secondary-text group-hover:text-primary-text transition-colors">
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>
    </Card>
  )
}

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

export function RegisterClientForm({ onSuccess, onCancel }: RegisterClientFormProps) {
  const fetcher = useFetcher<ActionResponse>()
  const isSubmitting = fetcher.state === "submitting"

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMonitoringOptions, setShowMonitoringOptions] = useState(false)
  const [showExecOptions, setShowExecOptions] = useState(false)

  // Basic options
  const [clientName, setClientName] = useState("")
  const [defaultTimeout, setDefaultTimeout] = useState("")
  const [retryAttempts, setRetryAttempts] = useState("")
  const [retryDelay, setRetryDelay] = useState("")
  const [enableMonitoring, setEnableMonitoring] = useState(false)
  const [enableEventEmitter, setEnableEventEmitter] = useState(false)

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

  // Handle fetcher response for toast notifications
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
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
  }, [fetcher.state, fetcher.data, clientName, onSuccess])

  return (
    <Card variant="default" size="md" className="w-full ">
      <CardHeader className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-badge-primary-bg/20">
          <Server size={20} className="text-badge-primary-text" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary-text">Register New Client</h2>
          <p className="text-xs text-muted-text">Connect to a Docker daemon</p>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <fetcher.Form method="post" className="space-y-5">
          <input type="hidden" name="intent" value="client:register" />
          <input type="hidden" name="clientName" value={clientName} />
          <input type="hidden" name="defaultTimeout" value={defaultTimeout} />
          <input type="hidden" name="retryAttempts" value={retryAttempts} />
          <input type="hidden" name="retryDelay" value={retryDelay} />
          <input type="hidden" name="enableMonitoring" value={enableMonitoring.toString()} />
          <input type="hidden" name="enableEventEmitter" value={enableEventEmitter.toString()} />

          {/* Monitoring Options Hidden Inputs */}
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

          {/* Exec Options Hidden Inputs */}
          <input type="hidden" name="workingDir" value={workingDir} />
          <input type="hidden" name="execEnv" value={execEnv} />
          <input type="hidden" name="tty" value={tty.toString()} />

          {/* Client Name - Primary Input */}
          <FormField
            label="Client Name"
            tooltip="A unique identifier for this Docker client connection. Use something descriptive like 'production-server' or 'local-dev'."
            htmlFor="clientNameInput"
          >
            <Input
              type="text"
              size="md"
              placeholder="my-docker-client"
              value={clientName}
              onChange={setClientName}
            />
          </FormField>

          {/* Quick Settings */}
          <div className="flex items-center gap-6 py-2">
            <div className="flex items-center gap-2">
              <Toggle checked={enableMonitoring} onChange={setEnableMonitoring} size="sm" />
              <HoverBubble
                label="Enable real-time monitoring of containers and host metrics"
                position="top"
              >
                <span className="text-sm text-secondary-text cursor-help flex items-center gap-1">
                  <Monitor size={14} />
                  Monitoring
                </span>
              </HoverBubble>
            </div>

            <div className="flex items-center gap-2">
              <Toggle checked={enableEventEmitter} onChange={setEnableEventEmitter} size="sm" />
              <HoverBubble
                label="Enable event-driven notifications for container state changes"
                position="top"
              >
                <span className="text-sm text-secondary-text cursor-help flex items-center gap-1">
                  <Activity size={14} />
                  Events
                </span>
              </HoverBubble>
            </div>
          </div>

          <Divider label="Configuration" className="my-4" />

          <div className="flex justify-between gap-2">
            {/* Advanced Options Section */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Cog size={18} />}
                title="Advanced Options"
                description="Timeout and retry settings"
                isOpen={showAdvanced}
                onToggle={() => setShowAdvanced(!showAdvanced)}
              />

              {showAdvanced && (
                <div className="ml-4 pl-4 border-l-2 border-badge-primary-bg/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <Card variant="elevated">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Timeout"
                        tooltip="Default timeout in milliseconds for Docker API requests"
                        htmlFor="defaultTimeoutInput"
                      >
                        <div className="relative">
                          <Input
                            type="number"
                            size="sm"
                            placeholder="30000"
                            value={defaultTimeout}
                            onChange={setDefaultTimeout}
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
                            size="sm"
                            placeholder="3"
                            value={retryAttempts}
                            onChange={setRetryAttempts}
                          />
                          <RefreshCw
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
                          />
                        </div>
                      </FormField>
                    </div>

                    <FormField
                      label="Retry Delay"
                      tooltip="Delay in milliseconds between retry attempts"
                      htmlFor="retryDelayInput"
                    >
                      <Input
                        type="number"
                        size="sm"
                        placeholder="1000"
                        value={retryDelay}
                        onChange={setRetryDelay}
                      />
                    </FormField>
                  </Card>
                </div>
              )}
            </div>

            {/* Monitoring Options Section */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Monitor size={18} />}
                title="Monitoring Options"
                description="Health checks and metrics intervals"
                isOpen={showMonitoringOptions}
                onToggle={() => setShowMonitoringOptions(!showMonitoringOptions)}
              />

              {showMonitoringOptions && (
                <div className="ml-4 pl-4 border-l-2 border-badge-primary-bg/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <Card variant="elevated">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Health Check"
                        tooltip="Interval for health check pings (ms)"
                        htmlFor="healthCheckIntervalInput"
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
                        tooltip="Interval for polling container events (ms)"
                        htmlFor="containerEventPollingInput"
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
                        tooltip="Interval for collecting host metrics (ms)"
                        htmlFor="hostMetricsIntervalInput"
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
                        tooltip="Interval for collecting container metrics (ms)"
                        htmlFor="containerMetricsIntervalInput"
                      >
                        <Input
                          type="number"
                          size="sm"
                          placeholder="5000"
                          value={containerMetricsInterval}
                          onChange={setContainerMetricsInterval}
                        />
                      </FormField>

                      <FormField
                        label="Retry Attempts"
                        tooltip="Retry attempts for monitoring operations"
                        htmlFor="monitoringRetryAttemptsInput"
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
                        label="Retry Delay"
                        tooltip="Delay between monitoring retries (ms)"
                        htmlFor="monitoringRetryDelayInput"
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

                    <Card className="mx-auto mt-4">
                      <p className="text-xs font-medium text-secondary-text mb-2">
                        Enable Features
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Checkbox
                          checked={enableContainerEvents}
                          onChange={setEnableContainerEvents}
                          label="Container Events"
                          size="sm"
                        />
                        <Checkbox
                          checked={enableHostMetrics}
                          onChange={setEnableHostMetrics}
                          label="Host Metrics"
                          size="sm"
                        />
                        <Checkbox
                          checked={enableContainerMetrics}
                          onChange={setEnableContainerMetrics}
                          label="Container Metrics"
                          size="sm"
                        />
                        <Checkbox
                          checked={enableHealthChecks}
                          onChange={setEnableHealthChecks}
                          label="Health Checks"
                          size="sm"
                        />
                      </div>
                    </Card>
                  </Card>
                </div>
              )}
            </div>

            {/* Exec Options Section */}
            <div className="space-y-3">
              <SectionHeader
                icon={<Terminal size={18} />}
                title="Exec Options"
                description="Command execution defaults"
                isOpen={showExecOptions}
                onToggle={() => setShowExecOptions(!showExecOptions)}
              />

              {showExecOptions && (
                <div className="ml-4 pl-4 border-l-2 border-badge-primary-bg/30 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <Card variant="elevated">
                    <FormField
                      label="Working Directory"
                      tooltip="Default working directory for exec commands"
                      htmlFor="workingDirInput"
                    >
                      <Input
                        type="text"
                        size="sm"
                        placeholder="/app"
                        value={workingDir}
                        onChange={setWorkingDir}
                      />
                    </FormField>

                    <FormField
                      label="Environment Variables"
                      tooltip="Comma-separated environment variables (e.g., NODE_ENV=production,DEBUG=true)"
                      htmlFor="execEnvInput"
                    >
                      <Input
                        type="text"
                        size="sm"
                        placeholder="NODE_ENV=production,DEBUG=true"
                        value={execEnv}
                        onChange={setExecEnv}
                      />
                    </FormField>

                    <Card className="flex space-x-4 mt-4" size="sm">
                      <Checkbox checked={tty} onChange={setTty} size="sm" />
                      <div>
                        <span className="text-sm text-primary-text">Allocate TTY</span>
                        <p className="text-xs text-muted-text">
                          Enable pseudo-terminal for interactive commands
                        </p>
                      </div>
                    </Card>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !clientName.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Registering...
                </span>
              ) : (
                "Register Client"
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" size="md" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </fetcher.Form>
      </CardBody>
    </Card>
  )
}
