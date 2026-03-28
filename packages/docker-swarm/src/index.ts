/**
 * @dockstat/docker-swarm
 *
 * A comprehensive TypeScript/JavaScript library for Docker Swarm operations.
 */

export type { SwarmClientOptions } from "./client"
// Main client
export { SwarmClient } from "./client"
export { ConfigsModule } from "./modules/configs"
export { NetworksModule } from "./modules/networks"
export { NodesModule } from "./modules/nodes"
export { SecretsModule } from "./modules/secrets"
export { ServicesModule } from "./modules/services"
export { StacksModule } from "./modules/stacks"
// Modules
export { SwarmModule } from "./modules/swarm"
export { TasksModule } from "./modules/tasks"

// Types
export * from "./types"
export {
  buildApiUrl,
  buildConnectionConfig,
  compareVersions,
  DEFAULT_HOST,
  DEFAULT_SOCKET_PATH,
  DEFAULT_TIMEOUT,
  isSocketAvailable,
  parseDockerVersion,
} from "./utils/docker-socket"
export type { LogContext, LogLevel } from "./utils/logger"

export { createModuleLogger, SwarmLogger } from "./utils/logger"
// Utilities
export {
  envArrayToRecord,
  envRecordToArray,
  mergeEnv,
  parseEnvContent,
  parseMountSpec,
  parsePortSpec,
  validateComposeStructure,
} from "./utils/parser"
