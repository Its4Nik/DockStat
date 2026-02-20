import { Database } from "bun:sqlite"
import type Logger from "@dockstat/logger"

/**
 * Restore database from a backup file
 *
 * Copies backupPath -> targetPath (or dbPath if targetPath omitted).
 * If restoring to the same path as dbPath, closes the provided Database
 * instance and reopens a new Database, returning it to the caller so the
 * DB wrapper can replace its `this.db` reference.
 *
 * @returns Database | null — a newly opened Database instance when the restore was
 * performed to the original dbPath (caller must replace its db reference);
 * otherwise null.
 */
export function restore(
  dbPath: string,
  db: Database,
  backupLog: Logger,
  backupPath: string,
  targetPath?: string
): Database | null {
  const fs = require("node:fs")

  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }

  const restorePath = targetPath || dbPath

  if (restorePath === ":memory:") {
    throw new Error("Cannot restore to an in-memory database path")
  }

  // If restoring to the same path, close current connection first
  if (restorePath === dbPath) {
    try {
      db.close()
    } catch (err) {
      // continue — if close fails, copy may still succeed or re-open will error
      backupLog.warn(`Error closing DB before restore: ${err}`)
    }
  }

  try {
    fs.copyFileSync(backupPath, restorePath)
    backupLog.info(`Restoring from: ${backupPath}`)

    // If we restored to the original database path, reopen and return new Database
    if (restorePath === dbPath) {
      const reopened = new Database(dbPath)
      backupLog.info("Database connection reopened after restore")
      return reopened
    }

    return null
  } catch (error) {
    backupLog.error(`Failed to restore backup: ${error}`)
    throw error
  }
}
