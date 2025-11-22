import type { DockerStreamManagerProxy } from "./docker-monitoring-manager"

import type * as ADAPTER from "./adapter"
import type * as DATABASE from "./database"
import type * as DOCKER from "./docker-client"
import type * as HOTKEY from "./hotkeys"
import type * as PLUGIN from "./plugins"
import type * as THEME from "./themes"

type EVENTS = DOCKER.DockerClientEvents & DockerStreamManagerProxy

export type { THEME, DATABASE, DOCKER, ADAPTER, HOTKEY, PLUGIN, EVENTS }

export * from "./adapter"
export * from "./docker-client"
export * from "./themes"
export * from "./database"
export * from "./hotkeys"
export * from "./plugins"
