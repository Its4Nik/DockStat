import type { EVENTS } from "@dockstat/typings"
import type { buildMessageFromProxyRes } from "@dockstat/typings/types"
import type { WorkerRequest, WorkerResponse } from "../types"
import type DB from "@dockstat/sqlite-wrapper"
import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DOCKER } from "@dockstat/typings"
import type Logger from "@dockstat/logger"

export type { WorkerRequest, WorkerResponse }

export type Constructor<T = object> = abstract new (...args: unknown[]) => T

export interface MixinChain<C extends Constructor> {
  with<R extends Constructor>(mixin: Mixin<C, R>): MixinChain<R>
  done(): C
}

export type Mixin<C extends Constructor, R extends Constructor = Constructor> = (Base: C) => R

export interface WorkerWrapper {
  worker: Worker
  clientId: number
  clientName: string
  hostIds: Set<number>
  busy: boolean
  lastUsed: number
  initialized: boolean
  lastError: string | null
  errorCount: number
  messageListener?: (event: MessageEvent) => void
  serverHooks: Map<
    number,
    {
      table: QueryBuilder
      logger: Logger
    }
  >
}

export type DockerClientTable = {
  id?: number
  name: string
  options: DOCKER.DockerAdapterOptions
}

// Event message type as returned by buildMessageFromProxyRes.
export type EventMessage<K extends keyof EVENTS = keyof EVENTS> = buildMessageFromProxyRes<K>

// Shape of the "proxy" event wrapper from workers
export interface ProxyEventEnvelope<K extends keyof EVENTS = keyof EVENTS> {
  type: "__event__"
  data: EventMessage<K>
}

export interface InitCompleteMessage {
  type: "__init_complete__"
  success: boolean
  error?: string
}

export interface MetricsMessage {
  type: "__metrics__"
  [key: string]: unknown
}

export type InternalWorkerMessage = InitCompleteMessage | MetricsMessage

// ---------- Type guards ----------

export const isInitCompleteMessage = (msg: unknown): msg is InitCompleteMessage => {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as Record<string, unknown>).type === "__init_complete__" &&
    typeof (msg as Record<string, unknown>).success === "boolean"
  )
}

export const isInternalWorkerMessage = (msg: unknown): msg is InternalWorkerMessage => {
  return (
    typeof msg === "object" &&
    msg !== null &&
    ((msg as Record<string, unknown>).type === "__init_complete__" ||
      (msg as Record<string, unknown>).type === "__metrics__")
  )
}

export const isWorkerResponse = <T = unknown>(msg: unknown): msg is WorkerResponse<T> => {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "success" in (msg as Record<string, unknown>) &&
    typeof (msg as Record<string, unknown>).success === "boolean"
  )
}

export const isProxyEventEnvelope = (payload: unknown): payload is ProxyEventEnvelope => {
  const p = payload as Record<string, unknown>
  return (
    typeof payload === "object" &&
    payload !== null &&
    (p.type === "__event__" || p.type === "__init_complete__" || p.type === "__metrics__") &&
    typeof p.data === "object" &&
    (payload as Record<string, unknown>).data !== null
  )
}

export const looksLikeEventMessage = (payload: unknown): payload is EventMessage<keyof EVENTS> => {
  const p = payload as Record<string, unknown>
  return typeof payload === "object" && typeof p.success === "boolean"
}

// For convenience in mixins
export type DBType = DB
export type DockerClientTableQuery = QueryBuilder<DockerClientTable>
