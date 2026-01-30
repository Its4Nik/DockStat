import type { AutoBackupOptions } from "../../index"
import { backup } from "./backup"
import { applyRetentionPolicy } from "./applyRetentionPolicy"

export function setupAutoBackup(
  dbPath: string,
  db: any,
  backupLog: any,
  options: AutoBackupOptions
): { timer: ReturnType<typeof setInterval> | null; autoBackupOptions: AutoBackupOptions } {
  if (dbPath === ":memory:") {
    backupLog.warn("Auto-backup is not available for in-memory databases")
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
  const path = require("node:path")

  if (!fs.existsSync(autoBackupOptions.directory)) {
    fs.mkdirSync(autoBackupOptions.directory, { recursive: true })
    backupLog.info(`Created backup directory: ${autoBackupOptions.directory}`)
  }

  // Create initial backup
  try {
    backup(dbPath, db, backupLog, autoBackupOptions)
  } catch (err) {
    backupLog.error(`Initial backup failed: ${err}`)
  }

  // Setup interval for periodic backups
  const timer = setInterval(() => {
    try {
      const p = backup(dbPath, db, backupLog, autoBackupOptions)
      // applyRetentionPolicy already invoked inside backup, but keep safety
      applyRetentionPolicy(backupLog, autoBackupOptions)
    } catch (err) {
      backupLog.error(`Auto-backup run failed: ${err}`)
    }
  }, autoBackupOptions.intervalMs)

  backupLog.info(
    `Auto-backup enabled: interval=${autoBackupOptions.intervalMs}ms, maxBackups=${autoBackupOptions.maxBackups}`
  )

  return { timer, autoBackupOptions }
}
