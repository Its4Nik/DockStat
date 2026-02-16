import type { ColumnDefinition, TableOptions } from "../../types"
import { buildColumnSQL } from "./buildColumnSQL"
import { buildTableConstraints } from "./buildTableConstraint"
import { isTableSchema } from "./isTableSchema"

const quoteIdent = (s: string) => `"${s.replace(/"/g, '""')}"`

export function buildTableSQL<_T extends Record<string, unknown>>(
  tableName: string,
  columns: Record<keyof _T, ColumnDefinition>,
  options?: TableOptions<_T>
) {
  const temp = options?.temporary ? "TEMPORARY " : tableName === ":memory:" ? "TEMPORARY " : ""
  const ifNot = options?.ifNotExists ? "IF NOT EXISTS " : ""
  const withoutRowId = options?.withoutRowId ? " WITHOUT ROWID" : ""

  let columnDefs: string
  let tableConstraints: string[] = []

  if (isTableSchema(columns)) {
    const parts: string[] = []

    for (const [colName, colDef] of Object.entries(columns)) {
      if (!colName) continue

      const sqlDef = buildColumnSQL(colName, colDef)
      parts.push(`${quoteIdent(colName)} ${sqlDef}`)
    }

    if (parts.length === 0) {
      throw new Error("No columns provided")
    }

    columnDefs = parts.join(", ")

    if (options?.constraints) {
      tableConstraints = buildTableConstraints(options.constraints)
    }
  } else {
    const parts: string[] = []

    for (const [col, def] of Object.entries(columns)) {
      if (!col) continue
      if (!def) {
        throw new Error(`Missing SQL type/constraints for column "${col}"`)
      }

      parts.push(`${quoteIdent(col)} ${def}`)
    }

    if (parts.length === 0) {
      throw new Error("No columns provided")
    }

    columnDefs = parts.join(", ")
  }

  const allDefinitions = [columnDefs, ...tableConstraints].join(", ")

  const sql = `CREATE ${temp}TABLE ${ifNot}${quoteIdent(
    tableName
  )} (${allDefinitions})${withoutRowId};`

  return {
    sql,
    columnNames: Object.keys(columns),
  }
}
