import type { Database } from "bun:sqlite"
import type Logger from "@dockstat/logger"
import type { AutoBackupOptions } from "../../index"
import { backup } from "./backup"
import { applyRetentionPolicy } from "./applyRetentionPolicy"

export function setupAutoBackup(
  dbPath: string,
  db: Database,
  backupLog: Logger,
  options: AutoBackupOptions
): { timer: ReturnType<typeof setInterval> | null; autoBackupOptions: AutoBackupOptions } {
  if (dbPath === ":memory:") {
    backupLog.warn("[AUTO_BACKUP] Not available for in-memory databases", dbPath)
  }

  const autoBackupOptions: AutoBackupOptions = {
    enabled: options.enabled,
    directory: options.directory,
    intervalMs: options.intervalMs ?? 60 * 60 * 1000,
    maxBackups: options.maxBackups ?? 10,
    filenamePrefix: options.filenamePrefix ?? "backup",
    compress: options.compress ?? false,
  }

  const fs = require("node:fs")

  if (!fs.existsSync(autoBackupOptions.directory)) {
    fs.mkdirSync(autoBackupOptions.directory, { recursive: true })
    backupLog.info("[AUTO_BACKUP] Created backup directory", autoBackupOptions.directory)
  }

  // Create initial backup
  try {
    backup(dbPath, db, backupLog, autoBackupOptions)
  } catch (err) {
    backupLog.error("[AUTO_BACKUP] Initial backup failed", dbPath)
  }

  // Setup interval for periodic backups
  const timer = setInterval(() => {
    try {
      backup(dbPath, db, backupLog, autoBackupOptions)
      // applyRetentionPolicy already invoked inside backup, but keep safety
      applyRetentionPolicy(backupLog, autoBackupOptions)
    } catch (err) {
      backupLog.error("[AUTO_BACKUP] Scheduled backup run failed", dbPath)
    }
  }, autoBackupOptions.intervalMs)

  backupLog.info(
    "[AUTO_BACKUP] Enabled | Interval: ${autoBackupOptions.intervalMs}ms | Max backups: ${autoBackupOptions.maxBackups}",
    dbPath
  )

  return { timer, autoBackupOptions }
}
