import { ArrowUpDown, ChevronDown, Filter, Search } from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "../Button/Button"
import { Input } from "../Forms/Input"

export interface Column<T> {
  key: keyof T
  title: string
  render?: (value: unknown, record: T) => React.ReactNode
  width?: string | number
  align?: "left" | "center" | "right"
  sortable?: boolean
  filterable?: boolean
}

export interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  size?: "sm" | "md" | "lg"
  searchable?: boolean
  searchPlaceholder?: string
}

export const Table = <T extends Record<string, unknown>>({
  data,
  columns,
  className = "",
  striped = false,
  bordered = false,
  hoverable = false,
  size = "md",
  searchable = false,
  searchPlaceholder = "Search...",
}: TableProps<T>): React.ReactElement => {
  const [searchValue, setSearchValue] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })
  const [filterColumn, setFilterColumn] = useState<keyof T | null>(null)
  const [filterValue, setFilterValue] = useState<string>("")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  }

  const filteredAndSortedData = useMemo(() => {
    let result = [...data]

    // Search
    if (searchable && searchValue) {
      result = result.filter((record) =>
        columns.some((col) => {
          const value = record[col.key]
          return String(value).toLowerCase().includes(searchValue.toLowerCase())
        })
      )
    }

    // Filter
    if (filterColumn && filterValue) {
      result = result.filter((record) =>
        String(record[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key!]
        const bVal = b[sortConfig.key!]

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchValue, sortConfig, filterColumn, filterValue, columns, searchable])

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
    setShowSortMenu(false)
  }

  const handleFilter = (key: keyof T) => {
    setFilterColumn(key)
    setShowFilterMenu(false)
  }

  const sortableColumns = columns.filter((col) => col.sortable !== false)
  const filterableColumns = columns.filter((col) => col.filterable !== false)

  return (
    <div className={className}>
      {searchable && (
        <div className="mb-4 flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={setSearchValue}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Button
              onClick={() => {
                setShowSortMenu(!showSortMenu)
                setShowFilterMenu(false)
              }}
              className="flex items-center gap-2 "
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {showSortMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10">
                {sortableColumns.map((col) => (
                  <Button
                    key={String(col.key)}
                    fullWidth
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-2 first:rounded-t-md last:rounded-b-md"
                  >
                    {col.title}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFilterMenu(!showFilterMenu)
                setShowSortMenu(false)
              }}
              className="flex items-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {filterableColumns.map((col) => (
                  <Button
                    fullWidth
                    key={String(col.key)}
                    onClick={() => handleFilter(col.key)}
                    className="text-left first:rounded-t-md last:rounded-b-md"
                  >
                    {col.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {filterColumn && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-secondary-text">
            Filter by {columns.find((c) => c.key === filterColumn)?.title}:
          </span>
          <Input
            type="text"
            placeholder="Enter filter value..."
            value={filterValue}
            onChange={setFilterValue}
            size="sm"
            className="max-w-xs"
          />
          <Button
            variant="danger"
            onClick={() => {
              setFilterColumn(null)
              setFilterValue("")
            }}
            className="text-sm"
          >
            Clear
          </Button>
        </div>
      )}

      <div
        className={`overflow-hidden shadow-sm rounded-lg ${
          bordered ? "border border-gray-200" : ""
        }`}
      >
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`${sizeClasses[size]} font-semibold text-gray-700 text-${column.align || "left"}`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedData.map((record, index) => (
              <tr
                key={`${index}-${JSON.stringify(record)}`}
                className={`${
                  hoverable ? "transition-colors duration-150 hover:bg-gray-50" : ""
                } ${striped && index % 2 === 0 ? "bg-gray-50" : ""}`}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`${sizeClasses[size]} text-${column.align || "left"} text-gray-900`}
                  >
                    {column.render
                      ? column.render(record[column.key], record)
                      : String(record[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
