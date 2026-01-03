import type { WorkerMetrics } from "@dockstat/docker-client/types"
import type { Column } from "@dockstat/ui"
import { Badge, Table } from "@dockstat/ui"
import { formatBytes, formatDuration } from "@dockstat/utils"
import { Activity, CheckCircle, XCircle } from "lucide-react"

interface WorkersTableProps {
  workers: WorkerMetrics[]
}

export function WorkersTable({ workers }: WorkersTableProps) {
  const columns: Column<WorkerMetrics>[] = [
    {
      key: "workerId",
      title: "Worker ID",
      width: 100,
      sortable: true,
      render: (value: number) => (
        <Badge variant="primary" size="sm">
          {value as number}
        </Badge>
      ),
    },
    {
      key: "clientName",
      title: "Client Name",
      sortable: true,
      filterable: true,
      render: (value: string) => <span className="font-semibold">{value}</span>,
    },
    {
      key: "initialized",
      title: "Status",
      width: 100,
      sortable: true,
      align: "center",
      render: (value: boolean) => {
        const isInitialized = value
        return (
          <div className="flex items-center justify-center gap-2">
            {isInitialized ? (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-green-500 text-sm font-medium">Ready</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-red-500" />
                <span className="text-red-500 text-sm font-medium">Not Ready</span>
              </>
            )}
          </div>
        )
      },
    },
    {
      key: "hostsManaged",
      title: "Hosts",
      width: 100,
      sortable: true,
      align: "center",
      render: (value: number) => (
        <Badge variant="secondary" size="sm">
          {value}
        </Badge>
      ),
    },
    {
      key: "activeStreams",
      title: "Active Streams",
      width: 120,
      sortable: true,
      align: "center",
      render: (value: number) => {
        const streams = value
        return (
          <Badge variant={streams > 0 ? "success" : "secondary"} size="sm">
            {streams}
          </Badge>
        )
      },
    },
    {
      key: "isMonitoring",
      title: "Monitoring",
      width: 120,
      sortable: true,
      align: "center",
      render: (value: boolean) => {
        const isMonitoring = value
        return isMonitoring ? (
          <div className="flex items-center justify-center gap-2">
            <Activity size={14} className="text-green-500" />
            <span className="text-green-500 text-sm font-medium">Active</span>
          </div>
        ) : (
          <span className="text-muted-text text-sm">Inactive</span>
        )
      },
    },
    {
      key: "uptime",
      title: "Uptime",
      width: 120,
      sortable: true,
      render: (value: number) => (
        <span className="text-sm font-medium">{formatDuration(value)}</span>
      ),
    },
    {
      key: "memoryUsage",
      title: "Memory Usage",
      width: 120,
      sortable: true,
      align: "right",
      render: (value: WorkerMetrics["memoryUsage"]) => {
        const memory = value
        if (!memory) return <span className="text-muted-text text-sm">N/A</span>
        const usedMB = formatBytes(memory.heapSize)
        const totalMB = formatBytes(memory.heapCapacity)
        return (
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">{usedMB}</span>
            <span className="text-xs text-muted-text">/ {totalMB}</span>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <Table
        data={workers}
        columns={columns}
        searchable
        searchPlaceholder="Search workers..."
        striped
        hoverable
        size="md"
        rowKey="workerId"
      />
    </div>
  )
}
