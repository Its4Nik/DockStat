import type { ColumnDefinition } from "../../types"
import { isSQLFunction } from "../../utils"

/**
 * Build SQL column definition from ColumnDefinition object
 */
export function buildColumnSQL(columnName: string, colDef: ColumnDefinition): string {
  const parts: string[] = []

  // Add type with optional parameters
  let typeStr = colDef.type
  if (colDef.length) {
    typeStr += `(${colDef.length})`
  } else if (colDef.precision !== undefined) {
    if (colDef.scale !== undefined) {
      typeStr += `(${colDef.precision}, ${colDef.scale})`
    } else {
      typeStr += `(${colDef.precision})`
    }
  }
  parts.push(typeStr)

  // Add PRIMARY KEY (must come before AUTOINCREMENT)
  if (colDef.primaryKey) {
    parts.push("PRIMARY KEY")
  }

  // Add AUTOINCREMENT (only valid with INTEGER PRIMARY KEY)
  if (colDef.autoincrement) {
    if (!colDef.type.includes("INT") || !colDef.primaryKey) {
      throw new Error(
        `AUTOINCREMENT can only be used with INTEGER PRIMARY KEY columns (column: ${columnName})`
      )
    }
    parts.push("AUTOINCREMENT")
  }

  // Add NOT NULL (but skip if PRIMARY KEY is already specified, as it's implicit)
  if (colDef.notNull && !colDef.primaryKey) {
    parts.push("NOT NULL")
  }

  // Add UNIQUE
  if (colDef.unique) {
    parts.push("UNIQUE")
  }

  // Add DEFAULT
  if (colDef.default !== undefined) {
    if (colDef.default === null) {
      parts.push("DEFAULT NULL")
    } else if (typeof colDef.default === "object" && colDef.default._type === "expression") {
      // Handle DefaultExpression
      parts.push(`DEFAULT (${colDef.default.expression})`)
    } else if (typeof colDef.default === "string") {
      // Handle string defaults - check if it's a function call or literal
      if (isSQLFunction(colDef.default)) {
        parts.push(`DEFAULT (${colDef.default})`)
      } else {
        // Literal string value
        parts.push(`DEFAULT '${colDef.default.replace(/'/g, "''")}'`)
      }
    } else if (typeof colDef.default === "boolean") {
      parts.push(`DEFAULT ${colDef.default ? 1 : 0}`)
    } else {
      parts.push(`DEFAULT ${colDef.default}`)
    }
  }

  // Add COLLATE
  if (colDef.collate) {
    parts.push(`COLLATE ${colDef.collate}`)
  }

  // Add CHECK constraint (replace placeholder with actual column name)
  if (colDef.check) {
    const checkConstraint = colDef.check.replace(
      /\{\{COLUMN\}\}/g,
      `"${columnName.replace(/"/g, '""')}"`
    )
    parts.push(`CHECK (${checkConstraint})`)
  }

  // Add REFERENCES (foreign key)
  if (colDef.references) {
    const ref = colDef.references
    let refClause = `REFERENCES "${ref.table.replace(/"/g, '""')}"("${ref.column.replace(/"/g, '""')}")`

    if (ref.onDelete) {
      refClause += ` ON DELETE ${ref.onDelete}`
    }

    if (ref.onUpdate) {
      refClause += ` ON UPDATE ${ref.onUpdate}`
    }

    parts.push(refClause)
  }

  // Add GENERATED column
  if (colDef.generated) {
    const storageType = colDef.generated.stored ? "STORED" : "VIRTUAL"
    parts.push(`GENERATED ALWAYS AS (${colDef.generated.expression}) ${storageType}`)
  }
  return parts.join(" ")
}
