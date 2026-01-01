export type LogLevel = "error" | "warn" | "info" | "debug"

export type LogEntry = {
  level: LogLevel
  message: string
  name: string
  parents: string[]
  requestId?: string
  timestamp: Date
  caller: string
}

export type LogHook = (entry: LogEntry) => void
