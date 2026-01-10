import type { DOCKER } from "@dockstat/typings"
import type { WorkerRequest } from "./types"

type InitMessage = {
  type: "__init__"
  dbPath: string
  clientId: number
  clientName: string
  options: DOCKER.DockerAdapterOptions
}

type MetricsMessage = {
  type: "__get_metrics__"
}

type InboundMessage = WorkerRequest | InitMessage | MetricsMessage

export type { InboundMessage, InitMessage, MetricsMessage }
