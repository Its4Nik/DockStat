import type { Logger } from "@dockstat/logger"
import type { TableOptions } from "../types"

type DenyReason =
  | "migration-disabled"
  | "temporary-table"
  | "memory-db"
  | "sqlite-temp-prefix"
  | "migration-temp-table"

function deny(reason: DenyReason, table: string, log?: Logger) {
  log?.info(`[migration:deny] ${table} -> ${reason}`)
  return false
}

function allow(table: string, log?: Logger) {
  log?.info(`[migration:allow] ${table}`)
  return true
}

export function allowMigration<_T extends Record<string, unknown>>(
  options: TableOptions<_T>,
  tableName: string,
  logger?: Logger
): boolean {
  // ---- GLOBAL SWITCH ----
  if (options.migrate?.enabled === false) {
    return deny("migration-disabled", tableName, logger)
  }

  // ---- TABLE FLAGS ----
  if (options.temporary === true) {
    return deny("temporary-table", tableName, logger)
  }

  // ---- SQLITE INTERNAL TABLES ----
  if (tableName === ":memory:") {
    return deny("memory-db", tableName, logger)
  }

  if (tableName.startsWith("temp_")) {
    return deny("sqlite-temp-prefix", tableName, logger)
  }

  const tempSuffix = options.migrate?.tempTableSuffix ?? "_migration_temp"
  if (tableName.startsWith(tempSuffix)) {
    return deny("migration-temp-table", tableName, logger)
  }

  // ---- SUCCESS ----
  return allow(tableName, logger)
}
