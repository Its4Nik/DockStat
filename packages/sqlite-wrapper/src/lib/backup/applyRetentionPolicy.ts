import type { Logger } from "@dockstat/logger"
import type { AutoBackupOptions } from "../../index"

/**
 * Apply retention policy to remove old backups
 */
export function applyRetentionPolicy(backupLog: Logger, autoBackupOptions: AutoBackupOptions): void {
  if (!autoBackupOptions) return

  const fs = require("node:fs")
  const path = require("node:path")

  const backupDir = autoBackupOptions.directory
  const prefix = autoBackupOptions.filenamePrefix || "backup"
  const maxBackups = autoBackupOptions.maxBackups || 10

  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((file: string) => file.startsWith(prefix) && file.endsWith(".db"))
      .map((file: string) => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
      }))
      .sort((a: { mtime: number }, b: { mtime: number }) => b.mtime - a.mtime) // newest first

    if (files.length > maxBackups) {
      const toDelete = files.slice(maxBackups)
      for (const file of toDelete) {
        fs.unlinkSync(file.path)
        backupLog.debug(`[RETENTION] Removing old backup: ${file.name}`, backupDir)
      }
      backupLog.info(`[RETENTION] Policy applied | Removed: ${toDelete.length} old backup(s) | Directory: ${backupDir}`)
    }
  } catch (error) {
    backupLog.error(`[RETENTION] Failed to apply retention policy | Error: ${error}`, backupDir)
  }
}
