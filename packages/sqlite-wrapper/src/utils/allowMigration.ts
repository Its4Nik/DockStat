import type { TableOptions } from "../types"
import type { SqliteLogger } from "./logger"

type DenyReason =
  | "migration-disabled"
  | "temporary-table"
  | "memory-db"
  | "sqlite-temp-prefix"
  | "migration-temp-table"

function deny(reason: DenyReason, table: string, log?: SqliteLogger) {
  log?.info(`[migration:deny] ${table} -> ${reason}`)
  return false
}

function allow(table: string, log?: SqliteLogger) {
  log?.info(`[migration:allow] ${table}`)
  return true
}

export function allowMigration<_T extends Record<string, unknown>>(
  options: TableOptions<_T>,
  tableName: string,
  log?: SqliteLogger
): boolean {
  // ---- GLOBAL SWITCH ----
  if (options.migrate?.enabled === false) {
    return deny("migration-disabled", tableName, log)
  }

  // ---- TABLE FLAGS ----
  if (options.temporary === true) {
    return deny("temporary-table", tableName, log)
  }

  // ---- SQLITE INTERNAL TABLES ----
  if (tableName === ":memory:") {
    return deny("memory-db", tableName, log)
  }

  if (tableName.startsWith("temp_")) {
    return deny("sqlite-temp-prefix", tableName, log)
  }

  const tempSuffix = options.migrate?.tempTableSuffix ?? "_migration_temp"
  if (tableName.startsWith(tempSuffix)) {
    return deny("migration-temp-table", tableName, log)
  }

  // ---- SUCCESS ----
  return allow(tableName, log)
}
