import type React from "react"
import { TableBody } from "./TableBody"
import { TableHeader } from "./TableHeader"
import { TableToolbar } from "./TableToolbar"
import type { TableProps } from "./types"
import { ROW_HEIGHTS } from "./types"
import { useTable } from "./useTable"

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
  } = useTable({ data, columns, searchable })

  const shouldVirtualize = processedData.length > virtualizeThreshold
  const effectiveRowHeight = rowHeight ?? ROW_HEIGHTS[size]

  return (
    <div className={className}>
      {searchable && (
        <TableToolbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder={searchPlaceholder}
          columns={columns}
          onSort={handleSort}
          onFilterSelect={setFilterColumn}
          filterColumn={filterColumn}
          filterValue={filterValue}
          onFilterChange={setFilterValue}
          onClearFilter={clearFilter}
        />
      )}

      <div
        className={`
          overflow-auto shadow-sm rounded-lg
          ${bordered ? "border border-gray-200" : ""}
        `}
        style={{ maxHeight: shouldVirtualize ? maxHeight : undefined }}
      >
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <TableHeader columns={columns} size={size} />
          <TableBody
            data={processedData}
            columns={columns}
            size={size}
            striped={striped}
            hoverable={hoverable}
            rowKey={rowKey}
            virtualize={shouldVirtualize}
            rowHeight={effectiveRowHeight}
            maxHeight={maxHeight}
          />
        </table>
      </div>

      {processedData.length === 0 && (
        <div className="text-center py-8 text-gray-500">No data available</div>
      )}
    </div>
  )
}
