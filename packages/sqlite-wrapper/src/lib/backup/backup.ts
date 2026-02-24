import { Database } from "bun:sqlite"
import type { AutoBackupOptions } from "../../index"
import { applyRetentionPolicy } from "./applyRetentionPolicy"
import type Logger from "@dockstat/logger"

/**
 * Create a backup of the database
 *
 * @param dbPath - original DB path
 * @param db - Database instance
 * @param backupLog - logger
 * @param autoBackupOptions - if present, used to create filename and apply retention
 * @param customPath - optional explicit backup path
 * @returns path to created backup
 */
export function backup(
  dbPath: string,
  db: Database,
  backupLog: Logger,
  autoBackupOptions?: AutoBackupOptions,
  customPath?: string
): string {
  if (dbPath === ":memory:") {
    throw new Error("Cannot backup an in-memory database")
  }

  const path = require("node:path")

  let backupPath: string

  if (customPath) {
    backupPath = customPath
  } else if (autoBackupOptions) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${autoBackupOptions.filenamePrefix}_${timestamp}.db`
    backupPath = path.join(autoBackupOptions.directory, filename)
  } else {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const dir = path.dirname(dbPath)
    const basename = path.basename(dbPath, path.extname(dbPath))
    backupPath = path.join(dir, `${basename}_backup_${timestamp}.db`)
  }

  try {
    db.run(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)
    backupLog.info(`Creating backup: ${backupPath}`)

    if (autoBackupOptions) {
      applyRetentionPolicy(backupLog, autoBackupOptions)
    }

    return backupPath
  } catch (error) {
    backupLog.error(`Failed to create backup: ${error}`)
    throw error
  }
}
