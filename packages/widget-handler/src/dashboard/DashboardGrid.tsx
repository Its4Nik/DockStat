/**
 * Dashboard Grid
 *
 * Responsive grid layout using react-grid-layout.
 */

import { useRef, useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import GridLayout from "react-grid-layout"
import type { Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import { useDashboard } from "../context"
import { WidgetRegistry } from "../lib/widget-registry"
import { WidgetWrapper } from "./WidgetWrapper"
import type { WidgetInstance, WidgetLayout, WidgetComponentProps } from "../types"

/**
 * Convert widget layout to react-grid-layout format
 */
function toGridLayout(widget: WidgetInstance): Layout {
  return {
    i: widget.id,
    x: widget.layout.x,
    y: widget.layout.y,
    w: widget.layout.w,
    h: widget.layout.h,
    minW: widget.layout.minW,
    minH: widget.layout.minH,
    maxW: widget.layout.maxW,
    maxH: widget.layout.maxH,
    static: widget.layout.static,
  }
}

/**
 * Convert react-grid-layout to widget layout
 */
function fromGridLayout(layout: Layout): { id: string; layout: WidgetLayout } {
  return {
    id: layout.i,
    layout: {
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
      minW: layout.minW,
      minH: layout.minH,
      maxW: layout.maxW,
      maxH: layout.maxH,
      static: layout.static,
    },
  }
}

/**
 * Custom WidthProvider using ResizeObserver
 */
function useContainerWidth(containerRef: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(1200)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef])

  return width
}

/**
 * Drop Zone Indicator
 */
function DropZoneIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 border-2 border-dashed border-primary rounded-lg bg-primary/5 flex items-center justify-center z-50"
    >
      <span className="text-primary font-medium">Drop widget here</span>
    </motion.div>
  )
}

/**
 * Get compact type for react-grid-layout
 */
function getCompactType(
  compact: boolean | "vertical" | "horizontal" | undefined
): "vertical" | "horizontal" | null {
  if (compact === false) return null
  if (compact === "horizontal") return "horizontal"
  return "vertical"
}

/**
 * Dashboard Grid Component
 */
export function DashboardGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { state, updateLayout, addWidget } = useDashboard()
  const { config } = state
  const width = useContainerWidth(containerRef)
  const [isDragOver, setIsDragOver] = useState(false)

  // Handle layout changes
  const handleLayoutChange = useCallback(
    (layouts: Layout[]) => {
      const updates = layouts.map(fromGridLayout)
      updateLayout(updates)
    },
    [updateLayout]
  )

  // Handle external widget drops
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const widgetType = e.dataTransfer.getData("widget-type")
      if (widgetType) {
        // Calculate drop position based on mouse position
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          const x = Math.floor(((e.clientX - rect.left) / width) * config.grid.columns)
          const y = Math.floor((e.clientY - rect.top) / (config.grid.rowHeight ?? 60))
          addWidget(widgetType, {
            layout: {
              x: Math.max(0, x),
              y: Math.max(0, y),
              w: 4,
              h: 2,
            },
          })
        }
      }
    },
    [width, config.grid.columns, config.grid.rowHeight, addWidget]
  )

  // Convert widgets to grid layout
  const layout = config.widgets.map(toGridLayout)
  const compactType = getCompactType(config.grid.compact)

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Empty State */}
      {config.widgets.length === 0 && (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-primary-text mb-2">No widgets yet</h3>
            <p className="text-muted-text mb-4">Open the widget palette below to add widgets</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {config.widgets.length > 0 && (
        <GridLayout
          className="layout"
          layout={layout}
          cols={config.grid.columns}
          rowHeight={config.grid.rowHeight ?? 60}
          width={width - 32}
          margin={[config.grid.gap ?? 16, config.grid.gap ?? 16]}
          containerPadding={[16, 16]}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle"
          isDraggable={state.isEditing}
          isResizable={state.isEditing}
          compactType={compactType}
          preventCollision={config.grid.preventCollision}
        >
          {config.widgets.map((widget) => {
            const definition = WidgetRegistry.get(widget.type)
            if (!definition) return null

            const Component = definition.component
            const dataState = state.dataSourceStates[widget.id]

            const componentProps: WidgetComponentProps = {
              id: widget.id,
              config: widget.config,
              data: dataState?.data ?? null,
              isLoading: dataState?.status === "loading" || dataState?.status === "refreshing",
              error: dataState?.error ?? null,
              lastUpdated: dataState?.lastUpdated ?? undefined,
              onConfigChange: () => {},
              onRefresh: () => {},
            }

            return (
              <div key={widget.id} className="overflow-hidden">
                <WidgetWrapper widget={widget}>
                  <Component {...componentProps} />
                </WidgetWrapper>
              </div>
            )
          })}
        </GridLayout>
      )}

      {/* Drop Zone Indicator */}
      <DropZoneIndicator isActive={isDragOver} />
    </div>
  )
}
