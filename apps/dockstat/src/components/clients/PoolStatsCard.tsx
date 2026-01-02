import { Card, CardBody, CardHeader } from "@dockstat/ui"
import { Activity, Box, Cpu, Users } from "lucide-react"

interface PoolMetrics {
  totalWorkers: number
  activeWorkers: number
  totalHosts: number
  totalClients: number
  averageHostsPerWorker: number
}

interface PoolStatsCardProps {
  poolStatus?: PoolMetrics
}

export function PoolStatsCard({ poolStatus }: PoolStatsCardProps) {
  if (!poolStatus) {
    return (
      <Card size="sm" variant="outlined" className="w-full">
        <CardHeader size="sm">
          <div className="flex items-center gap-2">
            <Activity size={20} />
            <span className="font-semibold text-lg">Pool Status</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center text-muted-text py-4">Loading pool status...</div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card size="sm" variant="outlined" className="w-full">
      <CardHeader size="sm" className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-primary-text" />
            <span className="font-semibold text-lg">Pool Status</span>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Workers */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card-default-bg border border-card-default-border">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={18} className="text-blue-500" />
              <span className="text-xs text-muted-text uppercase font-semibold">Workers</span>
            </div>
            <div className="text-2xl font-bold text-primary-text">{poolStatus.totalWorkers}</div>
            <div className="text-xs text-muted-text mt-1">{poolStatus.activeWorkers} active</div>
          </div>

          {/* Total Clients */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card-default-bg border border-card-default-border">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-green-500" />
              <span className="text-xs text-muted-text uppercase font-semibold">Clients</span>
            </div>
            <div className="text-2xl font-bold text-primary-text">{poolStatus.totalClients}</div>
            <div className="text-xs text-muted-text mt-1">configured</div>
          </div>

          {/* Total Hosts */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card-default-bg border border-card-default-border">
            <div className="flex items-center gap-2 mb-2">
              <Box size={18} className="text-purple-500" />
              <span className="text-xs text-muted-text uppercase font-semibold">Hosts</span>
            </div>
            <div className="text-2xl font-bold text-primary-text">{poolStatus.totalHosts}</div>
            <div className="text-xs text-muted-text mt-1">connected</div>
          </div>

          {/* Average Hosts per Worker */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card-default-bg border border-card-default-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-orange-500" />
              <span className="text-xs text-muted-text uppercase font-semibold">Avg Load</span>
            </div>
            <div className="text-2xl font-bold text-primary-text">
              {poolStatus.averageHostsPerWorker.toFixed(1)}
            </div>
            <div className="text-xs text-muted-text mt-1">hosts/worker</div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
