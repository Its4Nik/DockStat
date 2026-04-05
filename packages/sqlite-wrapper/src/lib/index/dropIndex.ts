import type { Database } from "bun:sqlite"

const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

export function dropIndex(db: Database, indexName: string, options?: { ifExists?: boolean }): void {
  const ifExists = options?.ifExists ? "IF EXISTS " : ""
  const sql = `DROP INDEX ${ifExists}${quoteIdent(indexName)};`
  db.run(sql)
}
