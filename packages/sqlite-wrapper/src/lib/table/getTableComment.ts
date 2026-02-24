import type { Database } from "bun:sqlite"

/**
 * Get table comment from metadata
 */
export function getTableComment(db: Database, tableName: string): string | null {
  try {
    const stmt = db.prepare(`
      SELECT comment FROM __table_metadata__ WHERE table_name = ?
    `)
    const result = stmt.get(tableName) as { comment: string } | undefined
    return result?.comment || null
  } catch (_error) {
    return null
  }
}
