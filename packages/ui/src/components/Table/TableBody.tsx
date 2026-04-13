import { memo, useCallback, useEffect, useRef, useState } from "react"
import { TableRow } from "./TableRow"
import type { Column, TableSize } from "./types"

interface TableBodyProps<T> {
  data: T[]
  columns: Column<T>[]
  size: TableSize
  striped: boolean
  hoverable: boolean
  rowKey?: keyof T | ((record: T, index: number) => string | number)
  virtualize: boolean
  rowHeight: number
  maxHeight: number
}

function TableBodyInner<T extends Record<string, unknown>>({
  data,
  columns,
  size,
  striped,
  hoverable,
  rowKey,
  virtualize,
  rowHeight,
  maxHeight,
}: TableBodyProps<T>): React.ReactElement {
  const containerRef = useRef<HTMLTableSectionElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(maxHeight)

  const getRowKey = useCallback(
    (record: T, index: number): string | number => {
      if (!rowKey) return index
      if (typeof rowKey === "function") return rowKey(record, index)
      return String(record[rowKey])
    },
    [rowKey]
  )

  useEffect(() => {
    if (!virtualize) return

    const container = containerRef.current?.parentElement?.parentElement
    if (!container) return

    const handleScroll = () => setScrollTop(container.scrollTop)
    const handleResize = () => setContainerHeight(container.clientHeight)

    container.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [virtualize])

  // Non-virtualized rendering
  if (!virtualize) {
    return (
      <tbody
        className="divide-y divide-table-body-divide"
        ref={containerRef}
      >
        {data.map((record, index) => (
          <TableRow
            columns={columns}
            hoverable={hoverable}
            index={index}
            key={getRowKey(record, index)}
            record={record}
            size={size}
            striped={striped}
          />
        ))}
      </tbody>
    )
  }

  // Virtualized rendering
  const totalHeight = data.length * rowHeight
  const overscan = 5
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2
  const endIndex = Math.min(data.length, startIndex + visibleCount)
  const visibleData = data.slice(startIndex, endIndex)

  return (
    <tbody
      className="relative"
      ref={containerRef}
    >
      {/* Spacer for total height */}
      <tr
        className="absolute w-0"
        style={{ height: totalHeight }}
      >
        <td />
      </tr>
      {visibleData.map((record, i) => {
        const actualIndex = startIndex + i
        return (
          <TableRow
            columns={columns}
            hoverable={hoverable}
            index={actualIndex}
            key={getRowKey(record, actualIndex)}
            record={record}
            size={size}
            striped={striped}
            style={{
              display: "table-row",
              height: rowHeight,
              position: "absolute",
              top: actualIndex * rowHeight,
              width: "100%",
            }}
          />
        )
      })}
    </tbody>
  )
}

export const TableBody = memo(TableBodyInner) as typeof TableBodyInner
