import type { DockerAdapterOptionsSchema, MonitoringOptions } from "@dockstat/typings"
import { Button, Card, CardBody, Divider, Input, Slider, Toggle } from "@dockstat/ui"
import { useState } from "react"
import { useDockerClientMutations } from "@/hooks/mutations"

export function AddClient() {
  const { createClientMutation } = useDockerClientMutations()
  const [clientName, setClientName] = useState("")
  const [options, setOptions] = useState<typeof DockerAdapterOptionsSchema.static>({
    defaultTimeout: 5000,
    enableEventEmitter: true,
    enableMonitoring: true,
    execOptions: {
      env: [],
      tty: false,
      workingDir: "/",
    },
    monitoringOptions: {
      containerEventPollingInterval: 5000,
      containerMetricsInterval: 10000,
      enableContainerEvents: true,
      enableContainerMetrics: true,
      enableHealthChecks: true,
      enableHostMetrics: true,
      healthCheckInterval: 30000,
      hostMetricsInterval: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    retryAttempts: 3,
    retryDelay: 1000,
  })

  const onSave = async () => {
    if (!clientName.trim()) return
    await createClientMutation.mutateAsync({
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
                    onChange={(e) => setClientName(e)}
                    placeholder="e.g. production-cluster-01"
                    value={clientName}
                  />
                </div>
                <Slider
                  label="Default Timeout"
                  max={30}
                  min={1}
                  onChange={(v) => setOptions((p) => ({ ...p, defaultTimeout: v * 1000 }))}
                  step={1}
                  value={(options.defaultTimeout ?? 5000) / 1000}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Slider
                    label="Retries"
                    max={10}
                    min={0}
                    onChange={(v) => setOptions((p) => ({ ...p, retryAttempts: v }))}
                    value={options.retryAttempts ?? 3}
                  />
                  <Slider
                    label="Delay (s)"
                    max={5}
                    min={0.1}
                    onChange={(v) => setOptions((p) => ({ ...p, retryDelay: v * 1000 }))}
                    step={0.1}
                    value={(options.retryDelay ?? 1000) / 1000}
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
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        execOptions: { ...p.execOptions, workingDir: e },
                      }))
                    }
                    value={options.execOptions?.workingDir ?? "/"}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Environment Variables</span>
                  <Input
                    onChange={(e) =>
                      setOptions((p) => ({
                        ...p,
                        execOptions: { ...p.execOptions, env: e.split(",") },
                      }))
                    }
                    placeholder="KEY=VALUE,DEBUG=true"
                    value={options.execOptions?.env?.join(",") ?? ""}
                  />
                </div>
                <Toggle
                  checked={options.execOptions?.tty ?? false}
                  label="Allocate TTY"
                  onChange={(checked) =>
                    setOptions((p) => ({
                      ...p,
                      execOptions: { ...p.execOptions, tty: checked },
                    }))
                  }
                  size="sm"
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
                    checked={options.enableMonitoring ?? true}
                    label="Global Monitoring"
                    onChange={(c) => setOptions((p) => ({ ...p, enableMonitoring: c }))}
                    size="sm"
                  />
                  <Toggle
                    checked={options.enableEventEmitter ?? true}
                    label="Event Streaming"
                    onChange={(c) => setOptions((p) => ({ ...p, enableEventEmitter: c }))}
                    size="sm"
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
                          checked={!!options.monitoringOptions?.[key as keyof MonitoringOptions]}
                          key={key}
                          label={label}
                          onChange={(c) =>
                            setOptions((p) => ({
                              ...p,
                              monitoringOptions: {
                                ...p.monitoringOptions,
                                [key]: c,
                              },
                            }))
                          }
                          size="sm"
                        />
                      ))}
                    </div>
                    <div className="space-y-4 pt-2">
                      <Slider
                        label="Health Interval (s)"
                        max={120}
                        min={5}
                        onChange={(v) =>
                          setOptions((p) => ({
                            ...p,
                            monitoringOptions: {
                              ...p.monitoringOptions,
                              healthCheckInterval: v * 1000,
                            },
                          }))
                        }
                        value={(options.monitoringOptions?.healthCheckInterval ?? 30000) / 1000}
                      />
                      <Slider
                        label="Metrics Polling (s)"
                        max={60}
                        min={5}
                        onChange={(v) =>
                          setOptions((p) => ({
                            ...p,
                            monitoringOptions: {
                              ...p.monitoringOptions,
                              containerMetricsInterval: v * 1000,
                            },
                          }))
                        }
                        value={
                          (options.monitoringOptions?.containerMetricsInterval ?? 10000) / 1000
                        }
                      />
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </section>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              className="w-full"
              disabled={!clientName.trim() || createClientMutation.isPending}
              onClick={onSave}
              size="lg"
            >
              {createClientMutation.isPending ? "Creating..." : "Register Docker Client"}
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
