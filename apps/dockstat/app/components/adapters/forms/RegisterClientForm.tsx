import { Button, Card, CardBody, CardHeader, Checkbox } from "@dockstat/ui"
import { useEffect, useState } from "react"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import type { ActionResponse, RegisterClientFormProps } from "../types"

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
    <Card size="sm" className="w-full max-w-lg">
      <CardHeader className="text-lg!">Register New Client</CardHeader>
      <CardBody>
        <fetcher.Form method="post" className="space-y-4">
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

          {/* Client Name */}
          <div>
            <label
              htmlFor="clientNameInput"
              className="block text-sm font-medium text-secondary-text mb-1"
            >
              Client Name
            </label>
            <input
              id="clientNameInput"
              type="text"
              placeholder="my-docker-client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-secondary-text hover:text-primary-text transition-colors"
          >
            {showAdvanced ? "▼ Hide" : "▶ Show"} Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-4 pl-2 border-l-2 border-divider-color">
              {/* Client Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-secondary-text">Client Options</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="defaultTimeoutInput"
                      className="block text-sm font-medium text-secondary-text mb-1"
                    >
                      Default Timeout (ms)
                    </label>
                    <input
                      id="defaultTimeoutInput"
                      type="number"
                      placeholder="30000"
                      value={defaultTimeout}
                      onChange={(e) => setDefaultTimeout(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="retryAttemptsInput"
                      className="block text-sm font-medium text-secondary-text mb-1"
                    >
                      Retry Attempts
                    </label>
                    <input
                      id="retryAttemptsInput"
                      type="number"
                      placeholder="3"
                      value={retryAttempts}
                      onChange={(e) => setRetryAttempts(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="retryDelayInput"
                    className="block text-sm font-medium text-secondary-text mb-1"
                  >
                    Retry Delay (ms)
                  </label>
                  <input
                    id="retryDelayInput"
                    type="number"
                    placeholder="1000"
                    value={retryDelay}
                    onChange={(e) => setRetryDelay(e.target.value)}
                    className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                  />
                </div>

                <div className="flex gap-4">
                  <Checkbox
                    checked={enableMonitoring}
                    onChange={setEnableMonitoring}
                    label="Enable Monitoring"
                    size="sm"
                  />

                  <Checkbox
                    checked={enableEventEmitter}
                    onChange={setEnableEventEmitter}
                    label="Enable Events"
                    size="sm"
                  />
                </div>
              </div>

              {/* Monitoring Options Toggle */}
              <button
                type="button"
                onClick={() => setShowMonitoringOptions(!showMonitoringOptions)}
                className="text-sm text-secondary-text hover:text-primary-text transition-colors"
              >
                {showMonitoringOptions ? "▼ Hide" : "▶ Show"} Monitoring Options
              </button>

              {showMonitoringOptions && (
                <div className="space-y-3 pl-2 border-l-2 border-divider-color">
                  <h4 className="text-sm font-semibold text-secondary-text">Monitoring Options</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="healthCheckIntervalInput"
                        className="block text-sm font-medium text-secondary-text mb-1"
                      >
                        Health Check Interval (ms)
                      </label>
                      <input
                        id="healthCheckIntervalInput"
                        type="number"
                        placeholder="30000"
                        value={healthCheckInterval}
                        onChange={(e) => setHealthCheckInterval(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="containerEventPollingInput"
                        className="block text-sm font-medium text-secondary-text mb-1"
                      >
                        Container Event Polling (ms)
                      </label>
                      <input
                        id="containerEventPollingInput"
                        type="number"
                        placeholder="5000"
                        value={containerEventPollingInterval}
                        onChange={(e) => setContainerEventPollingInterval(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="hostMetricsIntervalInput"
                        className="block text-sm font-medium text-secondary-text mb-1"
                      >
                        Host Metrics Interval (ms)
                      </label>
                      <input
                        id="hostMetricsIntervalInput"
                        type="number"
                        placeholder="10000"
                        value={hostMetricsInterval}
                        onChange={(e) => setHostMetricsInterval(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="containerMetricsIntervalInput"
                        className="block text-sm font-medium text-secondary-text mb-1"
                      >
                        Container Metrics Interval (ms)
                      </label>
                      <input
                        id="containerMetricsIntervalInput"
                        type="number"
                        placeholder="5000"
                        value={containerMetricsInterval}
                        onChange={(e) => setContainerMetricsInterval(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="monitoringRetryAttemptsInput"
                        className="block text-sm font-medium text-secondary-text mb-1"
                      >
                        Retry Attempts
                      </label>
                      <input
                        id="monitoringRetryAttemptsInput"
                        type="number"
                        placeholder="3"
                        value={monitoringRetryAttempts}
                        onChange={(e) => setMonitoringRetryAttempts(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="monitoringRetryDelayInput"
                        className="block text-sm font-medium text-secondary-text mb-1"
                      >
                        Retry Delay (ms)
                      </label>
                      <input
                        id="monitoringRetryDelayInput"
                        type="number"
                        placeholder="1000"
                        value={monitoringRetryDelay}
                        onChange={(e) => setMonitoringRetryDelay(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
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
                </div>
              )}

              {/* Exec Options Toggle */}
              <button
                type="button"
                onClick={() => setShowExecOptions(!showExecOptions)}
                className="text-sm text-secondary-text hover:text-primary-text transition-colors"
              >
                {showExecOptions ? "▼ Hide" : "▶ Show"} Exec Options
              </button>

              {showExecOptions && (
                <div className="space-y-3 pl-2 border-l-2 border-divider-color">
                  <h4 className="text-sm font-semibold text-secondary-text">Exec Options</h4>

                  <div>
                    <label
                      htmlFor="workingDirInput"
                      className="block text-sm font-medium text-secondary-text mb-1"
                    >
                      Working Directory
                    </label>
                    <input
                      id="workingDirInput"
                      type="text"
                      placeholder="/app"
                      value={workingDir}
                      onChange={(e) => setWorkingDir(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="execEnvInput"
                      className="block text-sm font-medium text-secondary-text mb-1"
                    >
                      Environment Variables (comma-separated)
                    </label>
                    <input
                      id="execEnvInput"
                      type="text"
                      placeholder="NODE_ENV=production,DEBUG=true"
                      value={execEnv}
                      onChange={(e) => setExecEnv(e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded-md border border-input-default-border bg-main-bg text-primary-text focus:outline-none focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring"
                    />
                  </div>

                  <Checkbox checked={tty} onChange={setTty} label="Allocate TTY" size="sm" />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register Client"}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </fetcher.Form>
      </CardBody>
    </Card>
  )
}
