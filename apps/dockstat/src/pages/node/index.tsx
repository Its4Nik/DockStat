import { useState } from "react"
import { Card, CardBody, CardHeader, Input, Toggle, Button, Divider, Slides } from "@dockstat/ui"
import { Server, Activity, Shield } from "lucide-react"
import { useEdenQuery } from "@/hooks/useEdenQuery"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { usePageHeading } from "@/hooks/useHeading"
import { useGlobalBusy } from "@/hooks/useGlobalBusy"
import { DockNodeCard } from "@/components/docknode/card"
import { api } from "@/lib/api"

type Target = {
  host: string
  name: string
  port: number
  timeout: number
  useSSL: boolean
}

export default function DockNodePage() {
  usePageHeading("DockNodes")

  const busy = useGlobalBusy()

  const [options, setOptions] = useState<Target>({
    host: "",
    name: "",
    port: 4040,
    timeout: 3,
    useSSL: true,
  })

  const isValid =
    options.name.trim().length >= 3 && options.host.trim().length >= 5 && options.port > 0

  const { data: docknodes, isLoading } = useEdenQuery({
    route: api.node.get,
    queryKey: ["getAllDockNodes"],
  })

  const createDockNodeMutation = useEdenMutation({
    route: api.node.post,
    mutationKey: ["createDockNode"],
    invalidateQueries: [["getAllDockNodes"]],
    toast: {
      errorTitle: (dn) => `${dn?.name || "DockNode"} could not be created`,
      successTitle: (dn) => `${dn?.name || "DockNode"} created`,
    },
  })

  const deleteDockNodeMutation = useEdenMutation({
    route: api.node.delete,
    mutationKey: ["deleteDockNode"],
    invalidateQueries: [["getAllDockNodes"]],
    toast: {
      errorTitle: (dn) => `${dn?.id || "DockNode"} could not be deleted`,
      successTitle: (dn) => `${dn?.id || "DockNode"} deleted`,
    },
  })

  const createDockNode = async () => {
    if (!isValid) return
    await createDockNodeMutation.mutateAsync({
      ...options,
      timeout: options.timeout * 1000,
    })
    setOptions({ host: "", name: "", port: 4040, timeout: 3, useSSL: true })
  }

  const deleteDockNode = async (id: number) => {
    await deleteDockNodeMutation.mutateAsync({ id })
  }

  return (
    <div className="space-y-6">
      {/* Header / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card size="sm" variant="flat" className="flex items-center gap-3">
          <Server size={20} className="text-accent" />
          <div>
            <div className="text-lg font-semibold">{docknodes?.length ?? 0}</div>
            <div className="text-sm text-muted-text">Total Nodes</div>
          </div>
        </Card>

        <Card size="sm" variant="flat" className="flex items-center gap-3">
          <Activity size={20} className="text-accent" />
          <div>
            <div className="text-lg font-semibold">
              {docknodes?.filter((n) => n.isReachable === "OK").length ?? 0}
            </div>
            <div className="text-sm text-muted-text">Online</div>
          </div>
        </Card>

        <Card size="sm" variant="flat" className="flex items-center gap-3">
          <Shield size={20} className="text-accent" />
          <div>
            <div className="text-lg font-semibold">
              {docknodes?.filter((n) => n.useSSL).length ?? 0}
            </div>
            <div className="text-sm text-muted-text">SSL Enabled</div>
          </div>
        </Card>
      </div>

      <Divider />

      {/* Create Node / Nodes List */}
      <div>
        <Card size="sm" variant="flat" className="flex items-center gap-2 mb-4">
          <Server size={20} className="text-accent" />
          <h2 className="text-2xl font-semibold text-muted-text">DockNodes</h2>
        </Card>

        {/* Inline Create Form (moved into Slides) */}
        <Slides buttonPosition="right" connected defaultSlide="Nodes">
          {{
            Nodes: isLoading ? (
              <div className="text-center py-12 text-muted-text">Loading dock nodes...</div>
            ) : !docknodes || docknodes.length === 0 ? (
              <Card className="text-center py-12 text-muted-text text-xl">
                No DockNodes configured yet. Use "
                <span className="text-accent">Create a new Node</span>" to create one.
              </Card>
            ) : (
              <Card variant="dark" className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docknodes.map((dn) => (
                    <DockNodeCard
                      key={dn.id ?? dn.name}
                      dn={dn}
                      isDisabled={busy || deleteDockNodeMutation.isPending}
                      deleteNode={deleteDockNode}
                    />
                  ))}
                </div>
              </Card>
            ),
            "Create a new Node": (
              <Card variant="elevated">
                <CardHeader className="font-semibold text-lg p-4">Create New DockNode</CardHeader>

                <CardBody className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-4 flex-col mr-4">
                      <div>
                        <p className="text-sm font-medium block mb-1">Node Name</p>
                        <Input
                          variant="underline"
                          value={options.name}
                          onChange={(v) => setOptions((o) => ({ ...o, name: v }))}
                          placeholder="production-node-01"
                        />
                        <p className="text-xs mt-1 text-muted-text">Minimum 5 characters</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium block mb-1">Host</p>
                        <Input
                          size="sm"
                          value={options.host}
                          onChange={(v) => setOptions((o) => ({ ...o, host: v }))}
                          placeholder="node.example.com"
                        />
                      </div>
                    </div>

                    <div className="flex-2">
                      <p className="text-sm font-medium block mb-1">Port</p>
                      <Input
                        type="number"
                        value={String(options.port)}
                        onChange={(v) => setOptions((o) => ({ ...o, port: Number(v) }))}
                        placeholder="4040"
                      />
                    </div>

                    <div className="flex-1 items-center m-4 my-auto">
                      <Toggle
                        checked={options.useSSL}
                        onChange={(v) => setOptions((o) => ({ ...o, useSSL: !!v }))}
                        label="Enable SSL"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={createDockNode}
                      disabled={!isValid || busy || createDockNodeMutation.isPending}
                    >
                      {createDockNodeMutation.isPending ? "Creating..." : "Create Node"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ),
          }}
        </Slides>
      </div>
    </div>
  )
}
