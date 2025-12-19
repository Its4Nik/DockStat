import { Badge, Modal } from "@dockstat/ui"
import { Container } from "lucide-react"
import type { HostDetailModalProps } from "./types"
import { ConfigValue } from "./misc/ConfigValue"
import { OptionsSection } from "./misc/OptionsSection"

export function HostDetailModal({
  open,
  onClose,
  host,
  client,
  worker,
  containerCount = 0,
}: HostDetailModalProps) {
  if (!host) return null
  OptionsSection
  const fullUrl = host.host
    ? `${host.secure ? "https" : "http"}://${host.host}${host.port ? `:${host.port}` : ""}`
    : null

  return (
    <Modal open={open} onClose={onClose} title={`Host: ${host.name}`} size="lg">
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Top Row - Host Info & Connection Details */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Basic Info */}
          <div className="flex-1 min-w-56">
            <OptionsSection title="Host Information">
              <div className="text-sm">
                <ConfigValue label="Host ID" value={host.id} />
                <ConfigValue label="Name" value={host.name} />
                <ConfigValue label="Client ID" value={host.clientId} />
                <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
                  <span className="text-muted-text">Containers</span>
                  <Badge variant="primary" size="sm" className="flex items-center gap-1">
                    <Container size={12} />
                    {containerCount}
                  </Badge>
                </div>
              </div>
            </OptionsSection>
          </div>

          {/* Connection Details */}
          <div className="flex-1 min-w-56">
            <OptionsSection title="Connection Details">
              <div className="text-sm">
                <ConfigValue label="Hostname" value={host.host} />
                <ConfigValue label="Port" value={host.port} />
                <ConfigValue label="Secure (HTTPS)" value={host.secure} />
                {fullUrl && (
                  <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
                    <span className="text-muted-text">Full URL</span>
                    <span className="text-primary-text font-mono text-xs bg-main-bg px-2 py-0.5 rounded">
                      {fullUrl}
                    </span>
                  </div>
                )}
              </div>
            </OptionsSection>
          </div>
        </div>

        {/* Middle Row - Client & Worker Info */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Associated Client */}
          {client && (
            <div className="flex-1 min-w-56">
              <OptionsSection title="Associated Client">
                <div className="text-sm">
                  <ConfigValue label="Client Name" value={client.clientName} />
                  <ConfigValue label="Client ID" value={client.clientId} />
                  <div className="flex justify-between py-1.5 border-b border-divider-color last:border-b-0">
                    <span className="text-muted-text">Client Status</span>
                    <Badge variant={client.initialized ? "success" : "warning"} size="sm">
                      {client.initialized ? "Initialized" : "Not Initialized"}
                    </Badge>
                  </div>
                </div>
              </OptionsSection>
            </div>
          )}

          {/* Worker Info (if available) */}
          {worker && (
            <div className="flex-1 min-w-56">
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
                  <ConfigValue label="Total Hosts Managed" value={worker.hostsManaged} />
                </div>
              </OptionsSection>
            </div>
          )}
        </div>

        {/* Bottom Row - Configuration Summary */}
        <OptionsSection title="Configuration Summary">
          <div className="text-sm py-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary" size="sm" outlined>
                Host #{host.id}
              </Badge>
              <Badge variant="primary" size="sm" className="flex items-center gap-1">
                <Container size={12} />
                {containerCount} container{containerCount !== 1 ? "s" : ""}
              </Badge>
              {host.secure && (
                <Badge variant="success" size="sm">
                  Secure
                </Badge>
              )}
              {!host.secure && (
                <Badge variant="warning" size="sm">
                  Insecure
                </Badge>
              )}
              {host.port && (
                <Badge variant="secondary" size="sm" outlined>
                  Port {host.port}
                </Badge>
              )}
              {client && (
                <Badge variant="primary" size="sm">
                  {client.clientName}
                </Badge>
              )}
            </div>
          </div>
        </OptionsSection>
      </div>
    </Modal>
  )
}
