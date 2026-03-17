import { Card, Modal } from "@dockstat/ui"
import { Search, X } from "lucide-react"
import { useState } from "react"
import { useDashboard } from "../context"
import { WidgetRegistry } from "../lib/widget-registry"
import type { WidgetDefinition } from "../types"

/**
 * Widget Card for the palette
 */
function WidgetCard({ widget }: { widget: WidgetDefinition }) {
  const { addWidget, setDrawerOpen } = useDashboard()

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("widget-type", widget.type)
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleClick = () => {
    addWidget(widget.type)
    setDrawerOpen(false)
  }

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="cursor-pointer text-left w-full"
    >
      <Card className="hover:ring-2 hover:ring-primary/50 transition-all" hoverable size="sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-2xl">{widget.icon}</span>
          <span className="text-sm font-medium text-primary-text">{widget.name}</span>
          <span className="text-xs text-muted-text line-clamp-2">{widget.description}</span>
        </div>
      </Card>
    </button>
  )
}

/**
 * Widget Drawer Component - Now rendered as a Modal
 */
export function WidgetDrawer() {
  const { state, setDrawerOpen } = useDashboard()
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const isOpen = state.isDrawerOpen
  const widgets = WidgetRegistry.getAll()
  const categories = WidgetRegistry.getCategories()

  // Filter widgets by search and category
  const filteredWidgets = widgets.filter((widget) => {
    const matchesSearch =
      !search ||
      widget.name.toLowerCase().includes(search.toLowerCase()) ||
      widget.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || widget.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleClose = () => {
    setDrawerOpen(false)
    setSearch("")
    setSelectedCategory(null)
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={`Widget Palette (${widgets.length} widgets)`}
      size="xl"
    >
      <div className="flex flex-col h-[60vh]">
        {/* Search and Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-color bg-main-bg text-primary-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-text hover:text-primary-text" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? "bg-primary text-button-primary-text"
                : "bg-hover-bg text-muted-text hover:text-primary-text"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? "bg-primary text-button-primary-text"
                  : "bg-hover-bg text-muted-text hover:text-primary-text"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredWidgets.map((widget) => (
              <WidgetCard key={widget.type} widget={widget} />
            ))}
          </div>

          {filteredWidgets.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-text">
              No widgets found
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
