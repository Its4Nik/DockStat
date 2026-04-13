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
      render: (value) => (
        <Badge
          size="sm"
          variant="primary"
        >
          {value as number}
        </Badge>
      ),
      sortable: true,
      title: "Worker ID",
      width: 100,
    },
    {
      filterable: true,
      key: "clientName",
      render: (value) => <span className="font-semibold">{value}</span>,
      sortable: true,
      title: "Client Name",
    },
    {
      align: "center",
      key: "initialized",
      render: (value) => {
        const isInitialized = value as boolean
        return (
          <div className="flex items-center justify-center gap-2">
            {isInitialized ? (
              <>
                <CheckCircle
                  className="text-green-500"
                  size={16}
                />
                <span className="text-green-500 text-sm font-medium">Ready</span>
              </>
            ) : (
              <>
                <XCircle
                  className="text-red-500"
                  size={16}
                />
                <span className="text-red-500 text-sm font-medium">Not Ready</span>
              </>
            )}
          </div>
        )
      },
      sortable: true,
      title: "Status",
      width: 100,
    },
    {
      align: "center",
      key: "hostsManaged",
      render: (value) => (
        <Badge
          size="sm"
          variant="secondary"
        >
          {value}
        </Badge>
      ),
      sortable: true,
      title: "Hosts",
      width: 100,
    },
    {
      align: "center",
      key: "activeStreams",
      render: (value) => {
        const streams = value as number
        return (
          <Badge
            size="sm"
            variant={streams > 0 ? "success" : "secondary"}
          >
            {streams}
          </Badge>
        )
      },
      sortable: true,
      title: "Active Streams",
      width: 120,
    },
    {
      align: "center",
      key: "isMonitoring",
      render: (value) => {
        const isMonitoring = value as boolean
        return isMonitoring ? (
          <div className="flex items-center justify-center gap-2">
            <Activity
              className="text-green-500"
              size={14}
            />
            <span className="text-green-500 text-sm font-medium">Active</span>
          </div>
        ) : (
          <span className="text-muted-text text-sm">Inactive</span>
        )
      },
      sortable: true,
      title: "Monitoring",
      width: 120,
    },
    {
      key: "uptime",
      render: (value) => (
        <span className="text-sm font-medium">{formatDuration(value as number)}</span>
      ),
      sortable: true,
      title: "Uptime",
      width: 120,
    },
    {
      align: "right",
      key: "memoryUsage",
      render: (value) => {
        const memory = value as WorkerMetrics["memoryUsage"]
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
      sortable: true,
      title: "Memory Usage",
      width: 120,
    },
  ]

  return (
    <div className="w-full">
      <Table
        columns={columns}
        data={workers}
        hoverable
        rowKey="workerId"
        searchable
        searchPlaceholder="Search workers..."
        size="md"
        striped
      />
    </div>
  )
}
