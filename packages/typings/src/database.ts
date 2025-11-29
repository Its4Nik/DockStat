import type { Action } from "./hotkeys"

type DB_target_host = {
	host: string // IP or DNS
	secure: boolean // SSL yes or no
	docker_client_id: number
	port: number
	name: string
	id: number
	createdAt?: Date
	updatedAt?: Date
}

type DB_config = {
	default_theme: string
	hotkeys: Record<string, Action>
	nav_links: { href: string; slug: string }[]
}

export type { DB_config, DB_target_host }
