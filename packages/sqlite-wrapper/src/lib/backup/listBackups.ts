import type { AutoBackupOptions } from "../../index"

/**
 * List all available backups
 *
 * @param autoBackupOptions - Auto-backup configuration (if not present, warns and returns empty array)
 * @param backupLog - logger used for warnings/errors
 * @returns Array of backup file information
 */
export function listBackups(
  autoBackupOptions: AutoBackupOptions | null | undefined,
  backupLog: any
): Array<{ filename: string; path: string; size: number; created: Date }> {
  if (!autoBackupOptions) {
    backupLog.warn("Auto-backup is not configured. Use backup() with a custom path instead.")
    return []
  }

  const fs = require("node:fs")
  const path = require("node:path")

  const backupDir = autoBackupOptions.directory
  const prefix = autoBackupOptions.filenamePrefix || "backup"

  try {
    return fs
      .readdirSync(backupDir)
      .filter((file: string) => file.startsWith(prefix) && file.endsWith(".db"))
      .map((file: string) => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
        }
      })
      .sort((a: { created: Date }, b: { created: Date }) => b.created.getTime() - a.created.getTime())
  } catch (error) {
    backupLog.error(`Failed to list backups: ${error}`)
    return []
  }
}
