/**
 * Widget Wrapper
 *
 * Wraps widgets with common functionality like selection, drag handle, etc.
 */

import { motion } from "framer-motion"
import { Trash2, Copy, RefreshCw, Settings } from "lucide-react"
import type { WidgetInstance } from "../types"
import { WidgetRegistry } from "../lib/widget-registry"
import { useDashboard, useWidgetDataState } from "../context"

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
    <div
      className={`relative w-full h-full rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-main-bg" : ""
      } ${isEditing ? "cursor-move" : ""}`}
      onClick={() => selectWidget(widget.id)}
      onKeyDown={(e) => {
        if (e.key === "Delete" && isSelected) {
          removeWidget(widget.id)
        }
      }}
      role="button"
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              refreshWidget(widget.id)
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-hover-bg transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-text" />
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              copyWidget(widget.id)
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-hover-bg transition-colors shadow-sm"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5 text-muted-text" />
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              selectWidget(widget.id)
              // TODO: Open settings modal
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-hover-bg transition-colors shadow-sm"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-muted-text" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeWidget(widget.id)
            }}
            className="p-1.5 rounded bg-card-default-bg/80 hover:bg-error/20 transition-colors shadow-sm"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-error" />
          </button>
        </motion.div>
      )}

      {/* Widget Type Badge (when editing) */}
      {isEditing && definition && (
        <div className="absolute bottom-2 left-2 text-xs text-muted-text bg-card-default-bg/80 px-2 py-0.5 rounded shadow-sm">
          {definition.name}
        </div>
      )}
    </div>
  )
}
