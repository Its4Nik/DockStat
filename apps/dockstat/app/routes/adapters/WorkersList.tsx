import { Card, CardBody, CardHeader } from "@dockstat/ui"
import type { Host, Worker } from "./types"
import { WorkerCard } from "./WorkerCard"

interface WorkersListProps {
  workers: Worker[]
  hosts?: Host[]
}

export function WorkersList({ workers, hosts = [] }: WorkersListProps) {
  if (workers.length === 0) {
    return (
      <Card variant="outlined" size="sm" className="w-full">
        <CardBody className="text-center text-muted-text">No active workers</CardBody>
      </Card>
    )
  }

  return (
    <Card variant="flat" size="sm" className="w-full">
      <CardHeader className="text-lg">Workers</CardHeader>
      <CardBody className="">
        <div className="flex flex-wrap gap-3">
          {workers.map((worker) => (

              <WorkerCard key={worker.workerId} worker={worker} hosts={hosts} />
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
