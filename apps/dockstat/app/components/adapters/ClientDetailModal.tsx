import type { DockerAdapterOptions } from "@dockstat/typings"
import { Badge, Modal } from "@dockstat/ui"
import { formatBytes, formatDuration } from "@dockstat/utils"
import { ConfigValue } from "./misc/ConfigValue"
import { OptionsSection } from "./misc/OptionsSection"
import type { ClientDetailModalProps } from "./types"

function MonitoringOptionsDisplay({
  options,
}: {
  options: DockerAdapterOptions["monitoringOptions"]
}) {
  if (!options || Object.keys(options).length === 0) {
    return <span className="text-muted-text text-sm italic">No monitoring options configured</span>
  }

  return (
    <div className="text-sm">
      <ConfigValue
        label="Health Check Interval"
        value={options.healthCheckInterval ? `${options.healthCheckInterval}ms` : undefined}
      />
      <ConfigValue
        label="Container Event Polling"
        value={
          options.containerEventPollingInterval
            ? `${options.containerEventPollingInterval}ms`
            : undefined
        }
      />
      <ConfigValue
        label="Host Metrics Interval"
        value={options.hostMetricsInterval ? `${options.hostMetricsInterval}ms` : undefined}
      />
      <ConfigValue
        label="Container Metrics Interval"
        value={
          options.containerMetricsInterval ? `${options.containerMetricsInterval}ms` : undefined
        }
      />
      <ConfigValue label="Container Events" value={options.enableContainerEvents} />
      <ConfigValue label="Host Metrics" value={options.enableHostMetrics} />
      <ConfigValue label="Container Metrics" value={options.enableContainerMetrics} />
      <ConfigValue label="Health Checks" value={options.enableHealthChecks} />
      <ConfigValue label="Retry Attempts" value={options.retryAttempts} />
      <ConfigValue
        label="Retry Delay"
        value={options.retryDelay ? `${options.retryDelay}ms` : undefined}
      />
    </div>
  )
}

function ExecOptionsDisplay({ options }: { options: DockerAdapterOptions["execOptions"] }) {
  if (!options || Object.keys(options).length === 0) {
    return <span className="text-muted-text text-sm italic">No exec options configured</span>
  }

  return (
    <div className="text-sm">
      <ConfigValue label="Working Directory" value={options.workingDir} />
      <ConfigValue label="TTY" value={options.tty} />
      {options.env && options.env.length > 0 && (
        <div className="py-1.5 border-b border-divider-color last:border-b-0">
          <span className="text-muted-text block mb-1">Environment Variables</span>
          <div className="flex flex-wrap gap-1">
            {options.env.map((env) => (
              <Badge key={env} variant="secondary" size="sm" outlined>
                {env}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClientDetailModal({
  open,
  onClose,
  client,
  worker,
  hosts = [],
}: ClientDetailModalProps) {
  if (!client) return null

  const clientHosts = hosts.filter((h) => h.clientId === client.clientId)
  const options = client.options || {}

  return (
    <Modal open={open} onClose={onClose} title={`Client: ${client.clientName}`} size="xl">
      <div>
        {/* Top Row - Basic Info & Worker Status */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Basic Info */}
          <div className="flex-1 min-w-64">
            <OptionsSection title="Basic Information">
              <div className="text-sm">
                <ConfigValue label="Client ID" value={client.clientId} />
                <ConfigValue label="Name" value={client.clientName} />
                <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
                  <span className="text-muted-text">Status</span>
                  <Badge variant={client.initialized ? "success" : "warning"} size="sm">
                    {client.initialized ? "Initialized" : "Not Initialized"}
                  </Badge>
                </div>
              </div>
            </OptionsSection>
          </div>

          {/* Worker Info (if available) */}
          {worker && (
            <div className="flex-1 min-w-64">
              <OptionsSection title="Worker Status">
                <div className="text-sm">
                  <ConfigValue label="Worker ID" value={worker.workerId} />
                  <div className="flex justify-between py-1.5 border-b border-divider-color">
                    <span className="text-muted-text">Monitoring</span>
                    <Badge variant={worker.isMonitoring ? "success" : "secondary"} size="sm">
                      {worker.isMonitoring ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <ConfigValue label="Active Streams" value={worker.activeStreams} />
                  <ConfigValue label="Hosts Managed" value={worker.hostsManaged} />
                  <ConfigValue label="Uptime" value={formatDuration(worker.uptime)} />
                  <ConfigValue
                    label="Heap Used"
                    value={formatBytes(worker.memoryUsage?.heapUsed || 0)}
                  />
                  <ConfigValue
                    label="Heap Total"
                    value={formatBytes(worker.memoryUsage?.heapTotal || 0)}
                  />
                  <ConfigValue label="RSS" value={formatBytes(worker.memoryUsage?.rss || 0)} />
                </div>
              </OptionsSection>
            </div>
          )}
        </div>

        {/* Middle Row - Client Options, Monitoring Options, Exec Options */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Client Options */}
          <div className="flex-1 min-w-56">
            <OptionsSection title="Client Options">
              <div className="text-sm">
                <ConfigValue
                  label="Default Timeout"
                  value={options.defaultTimeout ? `${options.defaultTimeout}ms` : undefined}
                />
                <ConfigValue label="Retry Attempts" value={options.retryAttempts} />
                <ConfigValue
                  label="Retry Delay"
                  value={options.retryDelay ? `${options.retryDelay}ms` : undefined}
                />
                <ConfigValue
                  label="Monitoring Manager"
                  value={
                    client.hasMonitoringManager ? (
                      <Badge variant="success" size="sm">
                        Created
                      </Badge>
                    ) : (
                      <Badge variant="error" size="sm">
                        Not found
                      </Badge>
                    )
                  }
                />
                <ConfigValue label="Monitoring Enabled" value={options.enableMonitoring} />
                <ConfigValue label="Event Emitter" value={options.enableEventEmitter} />
              </div>
            </OptionsSection>
          </div>

          {/* Monitoring Options */}
          <div className="flex-1 min-w-56">
            <OptionsSection title="Monitoring Options">
              <MonitoringOptionsDisplay options={options.monitoringOptions} />
            </OptionsSection>
          </div>

          {/* Exec Options */}
          <div className="flex-1 min-w-56">
            <OptionsSection title="Exec Options">
              <ExecOptionsDisplay options={options.execOptions} />
            </OptionsSection>
          </div>
        </div>

        {/* Bottom Row - Associated Hosts */}
        {clientHosts.length > 0 && (
          <OptionsSection title={`Associated Hosts (${clientHosts.length})`}>
            <div className="flex flex-wrap gap-2 py-1">
              {clientHosts.map((host) => (
                <div
                  key={host.id}
                  className="flex items-center justify-between py-2 px-3 bg-main-bg rounded-md min-w-48"
                >
                  <div>
                    <span className="font-medium text-sm">{host.name}</span>
                    {host.host && (
                      <div className="text-xs text-muted-text">
                        {host.secure ? "https" : "http"}://{host.host}
                        {host.port ? `:${host.port}` : ""}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" size="sm" outlined>
                    ID: {host.id}
                  </Badge>
                </div>
              ))}
            </div>
          </OptionsSection>
        )}
      </div>
    </Modal>
  )
}
