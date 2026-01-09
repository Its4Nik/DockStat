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
      style={style}
      className={`
        ${hoverable ? "transition-colors duration-150 hover:bg-table-body-hover" : ""}
        ${striped && index % 2 === 0 ? "bg-table-body-stripe" : "bg-table-body-bg"}
      `}
    >
      {columns.map((column) => (
        <td
          key={String(column.key)}
          className={`${SIZE_CLASSES[size]} text-table-body-text`}
          style={{
            textAlign: column.align ?? "left",
            minWidth: column.minWidth ?? 100,
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
