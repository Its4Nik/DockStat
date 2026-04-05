import { memo } from "react"
import type { Column, TableSize } from "./types"
import { SIZE_CLASSES } from "./types"

interface TableHeaderProps<T> {
  columns: Column<T>[]
  size: TableSize
}

function TableHeaderInner<T>({ columns, size }: TableHeaderProps<T>): React.ReactElement {
  return (
    <thead className="bg-table-head-bg sticky top-0 z-10">
      <tr>
        {columns.map((column) => (
          <th
            className={`${SIZE_CLASSES[size]} font-semibold text-table-head-text whitespace-nowrap`}
            key={String(column.key)}
            style={{
              minWidth: column.minWidth ?? 100,
              textAlign: column.align ?? "left",
              width: column.width,
            }}
          >
            {column.title}
          </th>
        ))}
      </tr>
    </thead>
  )
}

export const TableHeader = memo(TableHeaderInner) as typeof TableHeaderInner
