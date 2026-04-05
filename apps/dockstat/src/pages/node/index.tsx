import { Button, Card, CardBody, CardHeader, Divider, Input, Slides, Toggle } from "@dockstat/ui"
import { eden } from "@dockstat/utils/react"
import { Activity, Server, Shield } from "lucide-react"
import { useState } from "react"
import { DockNodeCard } from "@/components/docknode/card"
import { useDockNodeMutations } from "@/hooks/mutations"
import { useGlobalBusy } from "@/hooks/useGlobalBusy"
import { usePageHeading } from "@/hooks/useHeading"
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

  const { data: docknodes, isLoading } = eden.useEdenQuery({
    queryKey: ["getAllDockNodes"],
    route: api.node.get,
  })

  const { createDockNodeMutation, deleteDockNodeMutation } = useDockNodeMutations()

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
        <Card
          className="flex items-center gap-3"
          size="sm"
          variant="flat"
        >
          <Server
            className="text-accent"
            size={20}
          />
          <div>
            <div className="text-lg font-semibold">{docknodes?.length ?? 0}</div>
            <div className="text-sm text-muted-text">Total Nodes</div>
          </div>
        </Card>

        <Card
          className="flex items-center gap-3"
          size="sm"
          variant="flat"
        >
          <Activity
            className="text-accent"
            size={20}
          />
          <div>
            <div className="text-lg font-semibold">
              {docknodes?.filter((n) => n.isReachable === "OK").length ?? 0}
            </div>
            <div className="text-sm text-muted-text">Online</div>
          </div>
        </Card>

        <Card
          className="flex items-center gap-3"
          size="sm"
          variant="flat"
        >
          <Shield
            className="text-accent"
            size={20}
          />
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
        <Card
          className="flex items-center gap-2 mb-4"
          size="sm"
          variant="flat"
        >
          <Server
            className="text-accent"
            size={20}
          />
          <h2 className="text-2xl font-semibold text-muted-text">DockNodes</h2>
        </Card>

        {/* Inline Create Form (moved into Slides) */}
        <Slides
          buttonPosition="right"
          connected
          defaultSlide="Nodes"
        >
          {{
            "Create a new Node": (
              <Card variant="elevated">
                <CardHeader className="font-semibold text-lg p-4">Create New DockNode</CardHeader>

                <CardBody className="p-4 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-4 flex-col mr-4">
                      <div>
                        <p className="text-sm font-medium block mb-1">Node Name</p>
                        <Input
                          onChange={(v) => setOptions((o) => ({ ...o, name: v }))}
                          placeholder="production-node-01"
                          value={options.name}
                          variant="underline"
                        />
                        <p className="text-xs mt-1 text-muted-text">Minimum 5 characters</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium block mb-1">Host</p>
                        <Input
                          onChange={(v) => setOptions((o) => ({ ...o, host: v }))}
                          placeholder="node.example.com"
                          size="sm"
                          value={options.host}
                        />
                      </div>
                    </div>

                    <div className="flex-2">
                      <p className="text-sm font-medium block mb-1">Port</p>
                      <Input
                        onChange={(v) => setOptions((o) => ({ ...o, port: Number(v) }))}
                        placeholder="4040"
                        type="number"
                        value={String(options.port)}
                      />
                    </div>

                    <div className="flex-1 items-center m-4 my-auto">
                      <Toggle
                        checked={options.useSSL}
                        label="Enable SSL"
                        onChange={(v) => setOptions((o) => ({ ...o, useSSL: !!v }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={!isValid || busy || createDockNodeMutation.isPending}
                      onClick={createDockNode}
                    >
                      {createDockNodeMutation.isPending ? "Creating..." : "Create Node"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ),
            Nodes: isLoading ? (
              <div className="text-center py-12 text-muted-text">Loading dock nodes...</div>
            ) : !docknodes || docknodes.length === 0 ? (
              <Card className="text-center py-12 text-muted-text text-xl">
                No DockNodes configured yet. Use "
                <span className="text-accent">Create a new Node</span>" to create one.
              </Card>
            ) : (
              <Card
                className="p-4"
                variant="dark"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docknodes.map((dn) => (
                    <DockNodeCard
                      deleteNode={deleteDockNode}
                      dn={dn}
                      isDisabled={busy || deleteDockNodeMutation.isPending}
                      key={dn.id ?? dn.name}
                    />
                  ))}
                </div>
              </Card>
            ),
          }}
        </Slides>
      </div>
    </div>
  )
}
