import type React from "react"
import { TableBody } from "./TableBody"
import { TableHeader } from "./TableHeader"
import { TableToolbar } from "./TableToolbar"
import type { TableProps } from "./types"
import { ROW_HEIGHTS } from "./types"
import { useTable } from "./useTable"

export type { Column } from "./types"

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  className = "",
  striped = false,
  bordered = false,
  hoverable = false,
  size = "md",
  searchable = false,
  searchPlaceholder = "Search...",
  rowKey,
  virtualizeThreshold = 100,
  rowHeight,
  maxHeight = 600,
}: TableProps<T>): React.ReactElement {
  const {
    processedData,
    searchValue,
    setSearchValue,
    handleSort,
    filterColumn,
    setFilterColumn,
    filterValue,
    setFilterValue,
    clearFilter,
  } = useTable({ columns, data, searchable })

  const shouldVirtualize = processedData.length > virtualizeThreshold
  const effectiveRowHeight = rowHeight ?? ROW_HEIGHTS[size]

  return (
    <div className={`${className} w-full max-w-full`}>
      {searchable && (
        <TableToolbar
          columns={columns}
          filterColumn={filterColumn}
          filterValue={filterValue}
          onClearFilter={clearFilter}
          onFilterChange={setFilterValue}
          onFilterSelect={setFilterColumn}
          onSearchChange={setSearchValue}
          onSort={handleSort}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
        />
      )}

      <div
        className={`
          overflow-auto shadow-sm rounded-lg bg-table-body-bg text-table-body-text
          ${bordered ? "border border-table-border" : ""}
        `}
        style={{ maxHeight: shouldVirtualize ? maxHeight : undefined }}
      >
        <table className="min-w-full divide-y divide-table-head-divide table-fixed">
          <TableHeader
            columns={columns}
            size={size}
          />
          <TableBody
            columns={columns}
            data={processedData}
            hoverable={hoverable}
            maxHeight={maxHeight}
            rowHeight={effectiveRowHeight}
            rowKey={rowKey}
            size={size}
            striped={striped}
            virtualize={shouldVirtualize}
          />
        </table>
      </div>

      {processedData.length === 0 && (
        <div className="text-center py-8 text-muted-text">No data available</div>
      )}
    </div>
  )
}
