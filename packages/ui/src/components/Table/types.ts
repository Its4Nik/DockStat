import type React from "react"

export interface Column<T> {
  key: keyof T
  title: string
  render?: (value: T[keyof T], record: T) => React.ReactNode
  width?: string | number
  minWidth?: number
  align?: "left" | "center" | "right"
  sortable?: boolean
  filterable?: boolean
}

export interface SortConfig<T> {
  key: keyof T | null
  direction: "asc" | "desc"
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
  rowKey?: keyof T | ((record: T, index: number) => string | number)
  virtualizeThreshold?: number
  rowHeight?: number
  maxHeight?: number
}

export type TableSize = "sm" | "md" | "lg"

export const SIZE_CLASSES: Record<TableSize, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
}

export const ROW_HEIGHTS: Record<TableSize, number> = {
  sm: 32,
  md: 40,
  lg: 52,
}
