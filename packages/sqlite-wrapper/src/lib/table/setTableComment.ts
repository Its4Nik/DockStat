import type { Database } from "bun:sqlite"
import type { SqliteLogger } from "../../utils"

/**
 * Store table comment as metadata (using a system table if needed)
 */
export function setTableComment(
  db: Database,
  tableLog: SqliteLogger,
  tableName: string,
  comment: string
): void {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS __table_metadata__ (
        table_name TEXT PRIMARY KEY,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO __table_metadata__ (table_name, comment, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `)
    stmt.run(tableName, comment)
  } catch (error) {
    tableLog.warn(`Could not store table comment for ${tableName}: ${error}`)
  }
}
