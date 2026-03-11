/**
 * Dashboard Toolbar
 *
 * Toolbar with actions for dashboard management.
 */

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import {
  Upload,
  Download,
  Undo,
  Redo,
  Trash2,
  Edit3,
  Eye,
  Plus,
  FileJson,
  FileText,
} from "lucide-react"
import { Button, Divider } from "@dockstat/ui"
import { useDashboard } from "../context"
import YAML from "yaml"

/**
 * Dashboard Toolbar Component
 */
export function DashboardToolbar() {
  const {
    state,
    setEditing,
    setDrawerOpen,
    undo,
    redo,
    resetDashboard,
    exportDashboard,
    importDashboard,
  } = useDashboard()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  const { isEditing, isDirty, history } = state
  const canUndo = history.past.length > 0
  const canRedo = history.future.length > 0

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        try {
          const parsed = YAML.parse(content)
          importDashboard(JSON.stringify(parsed))
        } catch (error) {
          console.error("Failed to parse YAML:", error)
        }
      } else {
        importDashboard(content)
      }
    }
    reader.readAsText(file)

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle export
  const handleExport = (format: "json" | "yaml") => {
    const json = exportDashboard()
    let content: string
    let filename: string
    let mimeType: string

    if (format === "yaml") {
      const parsed = JSON.parse(json)
      content = YAML.stringify(parsed)
      filename = `${state.config.name.toLowerCase().replace(/\s+/g, "-")}.yaml`
      mimeType = "text/yaml"
    } else {
      content = json
      filename = `${state.config.name.toLowerCase().replace(/\s+/g, "-")}.json`
      mimeType = "application/json"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setIsExportMenuOpen(false)
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card-default-bg border-b border-border-color">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Dashboard Name */}
        <h1 className="text-lg font-semibold text-primary-text">
          {state.config.name}
          {isDirty && <span className="ml-2 text-xs text-muted-text">(unsaved)</span>}
        </h1>

        <Divider orientation="vertical" />

        {/* Edit Mode Toggle */}
        <Button
          variant={isEditing ? "primary" : "ghost"}
          size="sm"
          onClick={() => setEditing(!isEditing)}
        >
          {isEditing ? <Eye className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
          {isEditing ? "View Mode" : "Edit Mode"}
        </Button>

        <Divider orientation="vertical" />

        {/* Add Widget */}
        <Button variant="outline" size="sm" onClick={() => setDrawerOpen(!state.isDrawerOpen)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Widget
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={!canRedo}>
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <Divider orientation="vertical" />

        {/* Import */}
        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileImport}
          className="hidden"
        />

        {/* Export */}
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}>
            <Download className="w-4 h-4" />
          </Button>

          {isExportMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-1 bg-card-default-bg border border-border-color rounded-lg shadow-lg py-1 min-w-[150px] z-50"
            >
              <button
                type="button"
                onClick={() => handleExport("json")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-text hover:bg-hover-bg"
              >
                <FileJson className="w-4 h-4" />
                Export as JSON
              </button>
              <button
                type="button"
                onClick={() => handleExport("yaml")}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary-text hover:bg-hover-bg"
              >
                <FileText className="w-4 h-4" />
                Export as YAML
              </button>
            </motion.div>
          )}
        </div>

        <Divider orientation="vertical" />

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm("Are you sure you want to reset the dashboard?")) {
              resetDashboard()
            }
          }}
        >
          <Trash2 className="w-4 h-4 text-error" />
        </Button>
      </div>
    </div>
  )
}
