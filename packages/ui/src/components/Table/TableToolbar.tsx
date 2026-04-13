import { ArrowUpDown, ChevronDown, Filter, Search, X } from "lucide-react"
import type React from "react"
import { memo, useCallback, useState } from "react"
import { Button } from "../Button/Button"
import { Input } from "../Forms/Input"
import type { Column } from "./types"

interface TableToolbarProps<T> {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  columns: Column<T>[]
  onSort: (key: keyof T) => void
  onFilterSelect: (key: keyof T) => void
  filterColumn: keyof T | null
  filterValue: string
  onFilterChange: (value: string) => void
  onClearFilter: () => void
}

function TableToolbarInner<T>({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  columns,
  onSort,
  onFilterSelect,
  filterColumn,
  filterValue,
  onFilterChange,
  onClearFilter,
}: TableToolbarProps<T>): React.ReactElement {
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const sortableColumns = columns.filter((col) => col.sortable !== false)
  const filterableColumns = columns.filter((col) => col.filterable !== false)

  const handleSortClick = useCallback(
    (key: keyof T) => {
      onSort(key)
      setShowSortMenu(false)
    },
    [onSort]
  )

  const handleFilterClick = useCallback(
    (key: keyof T) => {
      onFilterSelect(key)
      setShowFilterMenu(false)
    },
    [onFilterSelect]
  )

  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
          <Input
            className="pl-10"
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            type="text"
            value={searchValue}
          />
        </div>

        <div className="relative">
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setShowSortMenu((v) => !v)
              setShowFilterMenu(false)
            }}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Sort</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
          {showSortMenu && (
            <div className="absolute z-20 right-0 mt-1 w-48 bg-card-default-bg border border-card-default-border rounded-md shadow-lg">
              {sortableColumns.map((col) => (
                <button
                  className="w-full text-left px-4 py-2 text-primary-text hover:bg-main-bg/20 first:rounded-t-md last:rounded-b-md"
                  key={String(col.key)}
                  onClick={() => handleSortClick(col.key)}
                  type="button"
                >
                  {col.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setShowFilterMenu((v) => !v)
              setShowSortMenu(false)
            }}
            variant="secondary"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
          {showFilterMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-card-default-bg border border-card-default-border rounded-md shadow-lg z-20">
              {filterableColumns.map((col) => (
                <button
                  className="w-full text-left px-4 py-2 text-primary-text hover:bg-main-bg/20 first:rounded-t-md last:rounded-b-md"
                  key={String(col.key)}
                  onClick={() => handleFilterClick(col.key)}
                  type="button"
                >
                  {col.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filterColumn && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-text">
            Filter by {columns.find((c) => c.key === filterColumn)?.title}:
          </span>
          <Input
            className="max-w-xs"
            onChange={onFilterChange}
            placeholder="Enter filter value..."
            size="sm"
            type="text"
            value={filterValue}
          />
          <Button
            onClick={onClearFilter}
            size="sm"
            variant="danger"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export const TableToolbar = memo(TableToolbarInner) as typeof TableToolbarInner
