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
  current_theme_name: string
}

export type { DB_config, DB_target_host }
