import { useCallback, useDeferredValue, useMemo, useState } from "react"
import type { Column, SortConfig } from "./types"

interface UseTableOptions<T> {
  data: T[]
  columns: Column<T>[]
  searchable: boolean
}

export function useTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchable,
}: UseTableOptions<T>) {
  const [searchValue, setSearchValue] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: null,
    direction: "asc",
  })
  const [filterColumn, setFilterColumn] = useState<keyof T | null>(null)
  const [filterValue, setFilterValue] = useState("")

  // Defer expensive filtering for better responsiveness
  const deferredSearch = useDeferredValue(searchValue)
  const deferredFilter = useDeferredValue(filterValue)

  const processedData = useMemo(() => {
    let result = data

    // Search
    if (searchable && deferredSearch) {
      const searchLower = deferredSearch.toLowerCase()
      result = result.filter((record) =>
        columns.some((col) => String(record[col.key]).toLowerCase().includes(searchLower))
      )
    }

    // Filter
    if (filterColumn && deferredFilter) {
      const filterLower = deferredFilter.toLowerCase()
      result = result.filter((record) =>
        String(record[filterColumn]).toLowerCase().includes(filterLower)
      )
    }

    // Sort
    if (sortConfig.key) {
      const key = sortConfig.key
      const dir = sortConfig.direction === "asc" ? 1 : -1

      result = [...result].sort((a, b) => {
        const aVal = a[key]
        const bVal = b[key]

        if (aVal == null) return dir
        if (bVal == null) return -dir
        if (aVal < bVal) return -dir
        if (aVal > bVal) return dir
        return 0
      })
    }

    return result
  }, [data, deferredSearch, sortConfig, filterColumn, deferredFilter, columns, searchable])

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }, [])

  const clearFilter = useCallback(() => {
    setFilterColumn(null)
    setFilterValue("")
  }, [])

  return {
    processedData,
    searchValue,
    setSearchValue,
    sortConfig,
    handleSort,
    filterColumn,
    setFilterColumn,
    filterValue,
    setFilterValue,
    clearFilter,
  }
}
