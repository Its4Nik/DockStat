import type { TableConstraints } from "../../types"

/**
 * Build table-level constraints
 */
export function buildTableConstraints<T>(constraints: TableConstraints<T>): string[] {
  const parts: string[] = []

  // PRIMARY KEY constraint
  if (constraints.primaryKey && constraints.primaryKey.length > 0) {
    const columns = constraints.primaryKey
      .map((col) => `"${String(col).replace(/"/g, '""')}"`)
      .join(", ")
    parts.push(`PRIMARY KEY (${columns})`)
  }

  // UNIQUE constraints
  if (constraints.unique) {
    if (Array.isArray(constraints.unique[0])) {
      // Multiple composite unique constraints
      for (const uniqueGroup of constraints.unique as string[][]) {
        const columns = uniqueGroup.map((col) => `"${col.replace(/"/g, '""')}"`).join(", ")
        parts.push(`UNIQUE (${columns})`)
      }
    } else {
      // Single unique constraint
      const columns = (constraints.unique as string[])
        .map((col) => `"${col.replace(/"/g, '""')}"`)
        .join(", ")
      parts.push(`UNIQUE (${columns})`)
    }
  }

  // CHECK constraints
  if (constraints.check) {
    for (const checkExpr of constraints.check) {
      parts.push(`CHECK (${checkExpr})`)
    }
  }

  // FOREIGN KEY constraints
  if (constraints.foreignKeys) {
    for (const fk of constraints.foreignKeys) {
      const columns = fk.columns.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(", ")
      const refColumns = fk.references.columns
        .map((col) => `"${col.replace(/"/g, '""')}"`)
        .join(", ")

      let fkClause = `FOREIGN KEY (${columns}) REFERENCES "${fk.references.table.replace(
        /"/g,
        '""'
      )}" (${refColumns})`

      if (fk.references.onDelete) {
        fkClause += ` ON DELETE ${fk.references.onDelete}`
      }

      if (fk.references.onUpdate) {
        fkClause += ` ON UPDATE ${fk.references.onUpdate}`
      }

      parts.push(fkClause)
    }
  }

  return parts
}
