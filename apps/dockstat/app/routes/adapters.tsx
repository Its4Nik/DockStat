import { Adapter } from "!L+A/adapters"
import { Button, Card, CardHeader, Divider } from "@dockstat/ui"
import { Activity, Database, Layers, Plus, Server } from "lucide-react"
import { useState } from "react"
import { useActionData, useLoaderData } from "react-router"
import {
  ClientsList,
  HostsList,
  StatCard,
  WorkersList,
  type AdapterStatus,
  type Client,
  type ClientWithConfig,
  type Host,
} from "./adapters/index"
import { AddHostForm, RegisterClientForm } from "./adapters/forms"
import type { ActionResponse } from "!L+A/adapters"

export const loader = Adapter.loader
export const action = Adapter.action

interface LoaderData {
  status: AdapterStatus
  clients: Client[]
  clientsWithConfig: ClientWithConfig[]
  hosts: Host[]
}

export default function Adapters() {
  const data = useLoaderData<LoaderData>()
  const actionData = useActionData<ActionResponse>()

  const [showClientForm, setShowClientForm] = useState(false)
  const [showHostForm, setShowHostForm] = useState(false)

  // Extract data with safe defaults
  const status = data?.status ?? {
    totalWorkers: 0,
    activeWorkers: 0,
    totalHosts: 0,
    totalClients: 0,
    averageHostsPerWorker: 0,
    workers: [],
    hosts: [],
  }
  const clients = data?.clients ?? []
  const clientsWithConfig = data?.clientsWithConfig ?? []
  const hosts = data?.hosts ?? []
  const workers = status.workers ?? []

  return (
    <div className="w-[95vw] mx-auto py-6 space-y-6">
      {/* Header */}
      <Card variant="flat" size="sm" className="w-full">
        <CardHeader className="border-b-0 flex justify-between pb-0">
          <span>Docker Adapters Overview</span>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowClientForm(!showClientForm)}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Add Client
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHostForm(!showHostForm)}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              Add Host
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Action Feedback */}
      {actionData && (
        <Card
          variant="outlined"
          size="sm"
          className={actionData.success ? "border-badge-success-bg" : "border-badge-error-bg"}
        >
          <div className="flex items-center gap-2 p-3">
            <span
              className={actionData.success ? "text-badge-success-text" : "text-badge-error-text"}
            >
              {actionData.success ? "✓" : "✗"}
            </span>
            <span className="text-sm">
              {actionData.success ? actionData.message : actionData.error}
            </span>
          </div>
        </Card>
      )}

      {/* Forms Row */}
      {(showClientForm || showHostForm) && (
        <div className="flex flex-wrap gap-4">
          {showClientForm && (
            <RegisterClientForm
              onSuccess={() => setShowClientForm(false)}
              onCancel={() => setShowClientForm(false)}
            />
          )}
          {showHostForm && <AddHostForm clients={clients} onClose={() => setShowHostForm(false)} />}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex w-full justify-between flex-wrap gap-4">
        <StatCard
          label="Total Clients"
          value={status.totalClients}
          icon={<Database size={20} />}
          variant="default"
        />
        <Divider className="w-10! my-auto" variant="dotted" />
        <StatCard
          label="Total Hosts"
          value={status.totalHosts}
          icon={<Server size={20} />}
          variant="default"
        />
        <Divider className="w-10! my-auto" variant="dotted" />
        <StatCard
          label="Active Workers"
          value={`${status.activeWorkers}/${status.totalWorkers}`}
          icon={<Activity size={20} />}
          variant={status.activeWorkers > 0 ? "success" : "warning"}
        />
        <Divider className="w-10! my-auto" variant="dotted" />
        <StatCard
          label="Avg Hosts/Worker"
          value={status.averageHostsPerWorker.toFixed(1)}
          icon={<Layers size={20} />}
          variant="default"
        />
      </div>

      <Divider />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients List - pass workers so it can merge status */}
        <ClientsList
          clients={clients}
          clientsWithConfig={clientsWithConfig}
          workers={workers}
          hosts={hosts}
        />

        {/* Hosts List */}
        <HostsList hosts={hosts} clients={clients} workers={workers} />
      </div>

      <Divider label="Worker Pool" />

      {/* Workers Section */}
      <WorkersList workers={workers} hosts={hosts} />
    </div>
  )
}
