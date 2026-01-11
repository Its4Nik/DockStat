import type { DockerAdapterOptionsSchema, MonitoringOptions } from "@dockstat/typings"
import { Button, Card, CardBody, Divider, Input, Slider, Toggle } from "@dockstat/ui"
import { useState } from "react"
import { useEdenMutation } from "@/hooks/useEdenMutation"
import { api } from "@/lib/api"

export function AddClient() {
  const [clientName, setClientName] = useState("")
  const [options, setOptions] = useState<typeof DockerAdapterOptionsSchema.static>({
    defaultTimeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableMonitoring: true,
    enableEventEmitter: true,
    monitoringOptions: {
      healthCheckInterval: 30000,
      containerEventPollingInterval: 5000,
      hostMetricsInterval: 10000,
      containerMetricsInterval: 10000,
      enableContainerEvents: true,
      enableHostMetrics: true,
      enableContainerMetrics: true,
      enableHealthChecks: true,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    execOptions: {
      workingDir: "/",
      env: [],
      tty: false,
    },
  })

  const registerClientMutation = useEdenMutation({
    mutationKey: ["createNewClient"],
    route: api.api.v2.docker.client.register.post,
    invalidateQueries: [["fetchDockerClients"], ["fetchPoolStatus"]],
    toast: {
      successTitle: (c) => `Client ${c.clientName} created`,
      errorTitle: (c) => `Could not create client ${c.clientName}`,
    },
  })

  const onSave = async () => {
    if (!clientName.trim()) return
    await registerClientMutation.mutateAsync({
      clientName,
      options,
    })
  }

  return (
    <div className="mx-auto max-w-6xl py-4">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column: Core Settings */}
        <div className="space-y-6">
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-text">
              Identity & Connectivity
            </h3>
            <Card variant="dark">
              <CardBody className="space-y-5">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Client Identifier</span>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e)}
                    placeholder="e.g. production-cluster-01"
                  />
                </div>
                <Slider
                  label="Default Timeout"
                  value={(options.defaultTimeout ?? 5000) / 1000}
                  onChange={(v) => setOptions((p) => ({ ...p, defaultTimeout: v * 1000 }))}
                  min={1}
                  max={30}
                  step={1}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Slider
                    label="Retries"
                    value={options.retryAttempts ?? 3}
                    onChange={(v) => setOptions((p) => ({ ...p, retryAttempts: v }))}
                    min={0}
                    max={10}
                  />
                  <Slider
                    label="Delay (s)"
                    value={(options.retryDelay ?? 1000) / 1000}
                    onChange={(v) => setOptions((p) => ({ ...p, retryDelay: v * 1000 }))}
                    min={0.1}
                    max={5}
                    step={0.1}
                  />
                </div>
              </CardBody>
            </Card>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-text">
              Execution Environment
            </h3>
            <Card variant="dark">
              <CardBody className="space-y-5">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Working Directory</span>
                  <Input
                    value={options.execOptions?.workingDir ?? "/"}
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        execOptions: { ...p.execOptions, workingDir: e },
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Environment Variables</span>
                  <Input
                    value={options.execOptions?.env?.join(",") ?? ""}
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        execOptions: { ...p.execOptions, env: e.split(",") },
                      }))
                    }
                    placeholder="KEY=VALUE,DEBUG=true"
                  />
                </div>
                <Toggle
                  size="sm"
                  label="Allocate TTY"
                  checked={options.execOptions?.tty ?? false}
                  onChange={(checked) =>
                    setOptions((p) => ({
                      ...p,
                      execOptions: { ...p.execOptions, tty: checked },
                    }))
                  }
                />
              </CardBody>
            </Card>
          </section>
        </div>

        {/* Right Column: Monitoring */}
        <div className="space-y-6">
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-text">
              Monitoring & Events
            </h3>
            <Card variant="dark">
              <CardBody className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Toggle
                    size="sm"
                    label="Global Monitoring"
                    checked={options.enableMonitoring ?? true}
                    onChange={(c) => setOptions((p) => ({ ...p, enableMonitoring: c }))}
                  />
                  <Toggle
                    size="sm"
                    label="Event Streaming"
                    checked={options.enableEventEmitter ?? true}
                    onChange={(c) => setOptions((p) => ({ ...p, enableEventEmitter: c }))}
                  />
                </div>

                {options.enableMonitoring && (
                  <>
                    <Divider />
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {[
                        ["Health", "enableHealthChecks"],
                        ["Events", "enableContainerEvents"],
                        ["Host", "enableHostMetrics"],
                        ["Containers", "enableContainerMetrics"],
                      ].map(([label, key]) => (
                        <Toggle
                          size="sm"
                          key={key}
                          label={label}
                          checked={!!options.monitoringOptions?.[key as keyof MonitoringOptions]}
                          onChange={(c) =>
                            setOptions((p) => ({
                              ...p,
                              monitoringOptions: { ...p.monitoringOptions, [key]: c },
                            }))
                          }
                        />
                      ))}
                    </div>
                    <div className="space-y-4 pt-2">
                      <Slider
                        label="Health Interval (s)"
                        value={(options.monitoringOptions?.healthCheckInterval ?? 30000) / 1000}
                        onChange={(v) =>
                          setOptions((p) => ({
                            ...p,
                            monitoringOptions: {
                              ...p.monitoringOptions,
                              healthCheckInterval: v * 1000,
                            },
                          }))
                        }
                        min={5}
                        max={120}
                      />
                      <Slider
                        label="Metrics Polling (s)"
                        value={
                          (options.monitoringOptions?.containerMetricsInterval ?? 10000) / 1000
                        }
                        onChange={(v) =>
                          setOptions((p) => ({
                            ...p,
                            monitoringOptions: {
                              ...p.monitoringOptions,
                              containerMetricsInterval: v * 1000,
                            },
                          }))
                        }
                        min={5}
                        max={60}
                      />
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </section>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={onSave}
              disabled={!clientName.trim() || registerClientMutation.isPending}
            >
              {registerClientMutation.isPending ? "Creating..." : "Register Docker Client"}
            </Button>
            <p className="text-center text-xs text-muted-text">
              Settings can be modified later in the client dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
