import type { Database } from "bun:sqlite"
import type { IndexColumn, IndexMethod } from "../../types"

const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

export function createIndex(
  db: Database,
  indexName: string,
  tableName: string,
  columns: IndexColumn | IndexColumn[],
  options?: {
    unique?: boolean
    ifNotExists?: boolean
    partial?: string
    where?: string
    using?: IndexMethod
  }
): void {
  const unique = options?.unique ? "UNIQUE " : ""
  const ifNot = options?.ifNotExists ? "IF NOT EXISTS " : ""
  const using = options?.using ? ` USING ${options.using}` : ""

  const normalizeColumn = (col: IndexColumn): string => {
    if (typeof col === "string") {
      return quoteIdent(col)
    }

    return `${quoteIdent(col.name)}${col.order ? ` ${col.order}` : ""}`
  }

  const columnList = Array.isArray(columns)
    ? columns.map(normalizeColumn).join(", ")
    : normalizeColumn(columns)

  let sql = `CREATE ${unique}INDEX ${ifNot}${quoteIdent(indexName)} ON ${quoteIdent(tableName)}${using} (${columnList})`

  const where = options?.where ?? options?.partial
  if (where) {
    sql += ` WHERE ${where}`
  }

  db.run(`${sql};`)
}
