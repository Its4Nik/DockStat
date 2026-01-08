import { Card } from "@dockstat/ui"
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
      <>
        <Card size="sm" variant="flat" className="w-full">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-accent" />
            <span className="font-semibold text-2xl text-muted-text">Pool Status</span>
          </div>
        </Card>
        <Card>
          <div className="text-center text-muted-text py-4">Loading pool status...</div>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card size="sm" variant="flat" className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-accent" />
            <span className="font-semibold text-2xl text-muted-text">Pool Status</span>
          </div>
        </div>
      </Card>
      <Card variant="dark">
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
      </Card>
    </>
  )
}
