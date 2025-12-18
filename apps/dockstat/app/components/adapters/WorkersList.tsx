import { Card, CardBody, CardHeader } from "@dockstat/ui"
import { Hammer } from "lucide-react"
import { WorkerCard } from "./WorkerCard"
import type { WorkersListProps } from "./types"

export function WorkersList({ workers, hosts = [] }: WorkersListProps) {
  if (workers.length === 0) {
    return (
      <Card variant="outlined" size="sm" className="w-full py-0">
        <CardBody className="text-center text-muted-text py-8">
          <Hammer className="mx-auto mb-2 opacity-50" size={32} />
          <p>No active workers</p>
          <p className="text-xs mt-1">Add a client to create a worker</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card variant="flat" size="sm" className="w-full">
      <CardHeader className="text-lg">Workers</CardHeader>
      <CardBody>
        <div className="flex flex-wrap gap-3">
          {workers.map((worker) => (
            <WorkerCard key={worker.workerId} worker={worker} hosts={hosts} />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
