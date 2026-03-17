/**
 * Widget Wrapper
 *
 * Wraps widgets with common functionality like selection, drag handle, etc.
 */

import { Button } from "@dockstat/ui"
import { motion } from "framer-motion"
import { Copy, RefreshCw, Settings, Trash2 } from "lucide-react"
import { useDashboard, useWidgetDataState } from "../context"
import { WidgetRegistry } from "../lib/widget-registry"
import type { WidgetInstance } from "../types"

interface WidgetWrapperProps {
  widget: WidgetInstance
  children: React.ReactNode
}

export function WidgetWrapper({ widget, children }: WidgetWrapperProps) {
  const { state, selectWidget, removeWidget, copyWidget, refreshWidget } = useDashboard()
  const dataState = useWidgetDataState(widget.id)
  const isSelected = state.selectedWidgetId === widget.id
  const isEditing = state.isEditing

  const definition = WidgetRegistry.get(widget.type)

  return (
    <button
      className={`relative w-full h-full rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-main-bg" : ""
      } ${isEditing ? "cursor-move" : ""}`}
      onClick={() => selectWidget(widget.id)}
      onKeyDown={(e) => {
        if (e.key === "Delete" && isSelected) {
          removeWidget(widget.id)
        }
      }}
      type="button"
      tabIndex={0}
    >
      {/* Widget Content */}
      <div className="w-full h-full">{children}</div>

      {/* Loading Overlay */}
      {dataState?.status === "loading" && (
        <div className="absolute inset-0 bg-main-bg/50 flex items-center justify-center rounded-lg">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-6 h-6 text-primary" />
          </motion.div>
        </div>
      )}

      {/* Error Overlay */}
      {dataState?.status === "error" && (
        <div className="absolute inset-0 bg-error/10 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <p className="text-error text-sm font-medium">Error loading data</p>
            <p className="text-muted-text text-xs mt-1">{dataState.error?.message}</p>
          </div>
        </div>
      )}

      {/* Edit Mode Controls */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          {/* Refresh Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              refreshWidget(widget.id)
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-hover-bg transition-colors shadow-sm"
          >
            <RefreshCw size={18} />
          </Button>

          {/* Copy Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              copyWidget(widget.id)
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-hover-bg transition-colors shadow-sm"
          >
            <Copy size={18} />
          </Button>

          {/* Settings Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              selectWidget(widget.id)
              // TODO: Open settings modal
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-hover-bg transition-colors shadow-sm"
          >
            <Settings size={18} />
          </Button>

          {/* Delete Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              removeWidget(widget.id)
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-error/20 transition-colors shadow-sm"
            variant="danger"
          >
            <Trash2 size={18} />
          </Button>
        </motion.div>
      )}

      {/* Widget Type Badge (when editing) */}
      {isEditing && definition && (
        <div className="absolute bottom-2 left-2 text-xs text-muted-text bg-card-default-bg/80 px-2 py-0.5 rounded shadow-sm">
          {definition.name}
        </div>
      )}
    </button>
  )
}
