import type { Action } from "./hotkeys"

type DB_target_host = {
  host: string // IP or DNS
  secure: boolean // SSL yes or no
  port: number
  name: string
  id: number
  createdAt?: Date
  updatedAt?: Date
}

type DB_config = {
  default_theme: string
  hotkeys: Record<string, Action>
}

export type { DB_config, DB_target_host }
