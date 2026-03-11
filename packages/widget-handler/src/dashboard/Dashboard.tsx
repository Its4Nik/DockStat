/**
 * Dashboard Component
 *
 * Main dashboard container that combines all dashboard components.
 */

import { useEffect } from "react"
import { DashboardProvider } from "../context"
import { DashboardToolbar } from "./DashboardToolbar"
import { DashboardGrid } from "./DashboardGrid"
import { WidgetDrawer } from "./WidgetDrawer"
import { WidgetRegistry } from "../lib/widget-registry"
import { builtinWidgets } from "../widgets"
import type { DashboardConfig } from "../types"

// Register built-in widgets
for (const widget of builtinWidgets) {
  WidgetRegistry.register(widget)
}

/**
 * Dashboard Inner Component
 */
function DashboardInner() {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        // undo is called through the reducer
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && e.key === "z") || (e.ctrlKey && e.key === "y")) {
        e.preventDefault()
        // redo is called through the reducer
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-main-bg pb-[calc(env(safe-area-inset-bottom)+4rem)]">
      <div className="shrink-0">
        <DashboardToolbar />
      </div>

      <div className="min-h-0 flex-1">
        <DashboardGrid />
      </div>

      {/* Fixed to bottom of viewport so it stays visible */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <WidgetDrawer />
      </div>
    </div>
  )
}

/**
 * Dashboard Props
 */
interface DashboardProps {
  /** Initial dashboard configuration */
  initialConfig?: DashboardConfig
  /** Callback when dashboard configuration changes */
  onConfigChange?: (config: DashboardConfig) => void
  /** Additional CSS class */
  className?: string
}

/**
 * Dashboard Component
 */
export function Dashboard({ initialConfig, onConfigChange, className }: DashboardProps) {
  return (
    <div className={`flex h-screen w-full flex-col overflow-hidden ${className ?? ""}`}>
      <DashboardProvider initialConfig={initialConfig} onConfigChange={onConfigChange}>
        <DashboardInner />
      </DashboardProvider>
    </div>
  )
}
