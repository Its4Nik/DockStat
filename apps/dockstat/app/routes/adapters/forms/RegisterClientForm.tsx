import { Button, Card, CardBody, CardHeader, Checkbox } from "@dockstat/ui"
import { useState } from "react"
import { useFetcher } from "react-router"

interface RegisterClientFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function RegisterClientForm({ onCancel }: RegisterClientFormProps) {
  const fetcher = useFetcher()
  const isSubmitting = fetcher.state === "submitting"

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [clientName, setClientName] = useState("")
  const [defaultTimeout, setDefaultTimeout] = useState("")
  const [retryAttempts, setRetryAttempts] = useState("")
  const [retryDelay, setRetryDelay] = useState("")
  const [enableMonitoring, setEnableMonitoring] = useState(false)
  const [enableEventEmitter, setEnableEventEmitter] = useState(false)

  return (
    <Card size="sm" className="w-full max-w-md">
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

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-secondary-text hover:text-primary-text transition-colors"
          >
            {showAdvanced ? "▼ Hide" : "▶ Show"} Advanced Options
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-2 border-l-2 border-divider-color">
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
