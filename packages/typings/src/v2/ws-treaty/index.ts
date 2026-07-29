interface BaseBody<Channels extends Record<string, unknown>, CK extends keyof Channels> {
  msg_id: string
  channel: CK
  data: Channels[CK]
}

type ContainerData = Array<{
  container_id: string
  ram_usage: number
  cpu_usage: number
  rx_bytes_sec: number
  tx_bytes_sec: number
  disk_usage: number
}>

type StacksData = Array<{
  stack_id: string
  event: "error" | "info" | "warning" | "progress"
  msg: string
}>

type LogData = Array<{
  log_id: string
  level: "debug" | "info" | "error" | "warning"
  msg: string
}>
