import { memo } from "react"
import type { Column, TableSize } from "./types"
import { SIZE_CLASSES } from "./types"

interface TableRowProps<T> {
  record: T
  columns: Column<T>[]
  size: TableSize
  striped: boolean
  hoverable: boolean
  index: number
  style?: React.CSSProperties
}

function TableRowInner<T extends Record<string, unknown>>({
  record,
  columns,
  size,
  striped,
  hoverable,
  index,
  style,
}: TableRowProps<T>): React.ReactElement {
  return (
    <tr
      className={`
        ${hoverable ? "transition-colors duration-150 hover:bg-table-body-hover" : ""}
        ${striped && index % 2 === 0 ? "bg-table-body-stripe" : "bg-table-body-bg"}
      `}
      style={style}
    >
      {columns.map((column) => (
        <td
          className={`${SIZE_CLASSES[size]} text-table-body-text`}
          key={String(column.key)}
          style={{
            minWidth: column.minWidth ?? 100,
            textAlign: column.align ?? "left",
          }}
        >
          {column.render
            ? column.render(record[column.key], record)
            : String(record[column.key] ?? "")}
        </td>
      ))}
    </tr>
  )
}

export const TableRow = memo(TableRowInner) as typeof TableRowInner
