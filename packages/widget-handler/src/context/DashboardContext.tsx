/**
 * Dashboard Context
 *
 * Provides dashboard state management with React Context.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react"
import { dataSourceManager } from "../lib/data-sources"
import { WidgetRegistry } from "../lib/widget-registry"
import type {
  DashboardAction,
  DashboardConfig,
  DashboardState,
  DataSourceState,
  WidgetInstance,
  WidgetLayout,
} from "../types"
import { DASHBOARD_VERSION, DEFAULT_DASHBOARD_SETTINGS, DEFAULT_GRID_CONFIG } from "../types"

/**
 * Create default dashboard configuration
 */
function createDefaultDashboard(): DashboardConfig {
  return {
    id: `dashboard-${Date.now()}`,
    name: "Untitled Dashboard",
    grid: DEFAULT_GRID_CONFIG,
    widgets: [],
    settings: DEFAULT_DASHBOARD_SETTINGS,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: DASHBOARD_VERSION,
  }
}

/**
 * Create initial dashboard state
 */
function createInitialState(config?: DashboardConfig): DashboardState {
  return {
    config: config ?? createDefaultDashboard(),
    dataSourceStates: {},
    selectedWidgetId: null,
    isEditing: true,
    isDrawerOpen: false,
    isDirty: false,
    clipboard: null,
    history: {
      past: [],
      future: [],
      maxSize: 50,
    },
  }
}

/**
 * Dashboard reducer
 */
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "ADD_WIDGET": {
      const newHistoryEntry = {
        widgets: [...state.config.widgets],
        timestamp: new Date(),
        action: "Add widget",
      }
      return {
        ...state,
        config: {
          ...state.config,
          widgets: [...state.config.widgets, action.payload],
          updatedAt: new Date(),
        },
        history: {
          ...state.history,
          past: [...state.history.past.slice(-(state.history.maxSize - 1)), newHistoryEntry],
          future: [],
        },
        isDirty: true,
      }
    }

    case "REMOVE_WIDGET": {
      const newHistoryEntry = {
        widgets: [...state.config.widgets],
        timestamp: new Date(),
        action: "Remove widget",
      }
      return {
        ...state,
        config: {
          ...state.config,
          widgets: state.config.widgets.filter((w) => w.id !== action.payload),
          updatedAt: new Date(),
        },
        selectedWidgetId: state.selectedWidgetId === action.payload ? null : state.selectedWidgetId,
        history: {
          ...state.history,
          past: [...state.history.past.slice(-(state.history.maxSize - 1)), newHistoryEntry],
          future: [],
        },
        isDirty: true,
      }
    }

    case "UPDATE_WIDGET": {
      const newHistoryEntry = {
        widgets: [...state.config.widgets],
        timestamp: new Date(),
        action: "Update widget",
      }
      return {
        ...state,
        config: {
          ...state.config,
          widgets: state.config.widgets.map((w) =>
            w.id === action.payload.id ? { ...w, ...action.payload.updates } : w
          ),
          updatedAt: new Date(),
        },
        history: {
          ...state.history,
          past: [...state.history.past.slice(-(state.history.maxSize - 1)), newHistoryEntry],
          future: [],
        },
        isDirty: true,
      }
    }

    case "UPDATE_LAYOUT": {
      const layoutMap = new Map(action.payload.map((l) => [l.id, l.layout]))
      return {
        ...state,
        config: {
          ...state.config,
          widgets: state.config.widgets.map((w) => {
            const newLayout = layoutMap.get(w.id)
            return newLayout ? { ...w, layout: newLayout } : w
          }),
          updatedAt: new Date(),
        },
        isDirty: true,
      }
    }

    case "SELECT_WIDGET":
      return {
        ...state,
        selectedWidgetId: action.payload,
      }

    case "SET_EDITING":
      return {
        ...state,
        isEditing: action.payload,
      }

    case "SET_DRAWER_OPEN":
      return {
        ...state,
        isDrawerOpen: action.payload,
      }

    case "SET_DATA_STATE":
      return {
        ...state,
        dataSourceStates: {
          ...state.dataSourceStates,
          [action.payload.id]: {
            ...state.dataSourceStates[action.payload.id],
            ...action.payload.state,
          },
        },
      }

    case "SET_DIRTY":
      return {
        ...state,
        isDirty: action.payload,
      }

    case "COPY_WIDGET": {
      const widget = state.config.widgets.find((w) => w.id === action.payload)
      return {
        ...state,
        clipboard: widget ?? null,
      }
    }

    case "PASTE_WIDGET": {
      if (!state.clipboard) return state
      const newWidget: WidgetInstance = {
        ...state.clipboard,
        id: `${state.clipboard.type}-${Date.now()}`,
        layout: {
          ...state.clipboard.layout,
          x: state.clipboard.layout.x + 1,
          y: state.clipboard.layout.y + 1,
        },
      }
      return {
        ...state,
        config: {
          ...state.config,
          widgets: [...state.config.widgets, newWidget],
          updatedAt: new Date(),
        },
        isDirty: true,
      }
    }

    case "UNDO": {
      const { past, future } = state.history
      if (past.length === 0) return state

      const previous = past[past.length - 1]
      const newPast = past.slice(0, -1)

      return {
        ...state,
        config: {
          ...state.config,
          widgets: previous.widgets,
          updatedAt: new Date(),
        },
        history: {
          ...state.history,
          past: newPast,
          future: [
            {
              widgets: state.config.widgets,
              timestamp: new Date(),
              action: "Undo",
            },
            ...future,
          ],
        },
        isDirty: true,
      }
    }

    case "REDO": {
      const { past, future } = state.history
      if (future.length === 0) return state

      const next = future[0]
      const newFuture = future.slice(1)

      return {
        ...state,
        config: {
          ...state.config,
          widgets: next.widgets,
          updatedAt: new Date(),
        },
        history: {
          ...state.history,
          past: [
            ...past,
            {
              widgets: state.config.widgets,
              timestamp: new Date(),
              action: "Redo",
            },
          ],
          future: newFuture,
        },
        isDirty: true,
      }
    }

    case "LOAD_DASHBOARD":
      return {
        ...createInitialState(action.payload),
        isDirty: false,
      }

    case "RESET_DASHBOARD":
      return createInitialState()

    default:
      return state
  }
}

/**
 * Context value type
 */
interface DashboardContextValue {
  state: DashboardState
  addWidget: (type: string, overrides?: Partial<WidgetInstance>) => void
  removeWidget: (id: string) => void
  updateWidget: (id: string, updates: Partial<WidgetInstance>) => void
  updateLayout: (layouts: { id: string; layout: WidgetLayout }[]) => void
  selectWidget: (id: string | null) => void
  setEditing: (editing: boolean) => void
  setDrawerOpen: (open: boolean) => void
  copyWidget: (id: string) => void
  pasteWidget: () => void
  undo: () => void
  redo: () => void
  loadDashboard: (config: DashboardConfig) => void
  resetDashboard: () => void
  refreshWidget: (id: string) => void
  exportDashboard: () => string
  importDashboard: (json: string) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

/**
 * Dashboard Provider Props
 */
interface DashboardProviderProps {
  children: ReactNode
  initialConfig?: DashboardConfig
  onConfigChange?: (config: DashboardConfig) => void
}

/**
 * Dashboard Provider Component
 */
export function DashboardProvider({
  children,
  initialConfig,
  onConfigChange,
}: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, createInitialState(initialConfig))

  // Notify on config changes
  useEffect(() => {
    if (onConfigChange && state.isDirty) {
      onConfigChange(state.config)
    }
  }, [state.config, state.isDirty, onConfigChange])

  // Start data source auto-refresh for widgets
  useEffect(() => {
    for (const widget of state.config.widgets) {
      const definition = WidgetRegistry.get(widget.type)
      const dataSource = widget.dataSource ?? definition?.defaultDataSource

      if (dataSource) {
        dataSourceManager.startAutoRefresh(widget.id, dataSource, (dsState: DataSourceState) => {
          dispatch({
            type: "SET_DATA_STATE",
            payload: { id: widget.id, state: dsState },
          })
        })
      }
    }

    return () => {
      dataSourceManager.stopAllAutoRefresh()
    }
  }, [state.config.widgets])

  const addWidget = useCallback((type: string, overrides?: Partial<WidgetInstance>) => {
    const instance = WidgetRegistry.createInstance(type, overrides)
    if (instance) {
      dispatch({ type: "ADD_WIDGET", payload: instance })
    }
  }, [])

  const removeWidget = useCallback((id: string) => {
    dataSourceManager.stopAutoRefresh(id)
    dispatch({ type: "REMOVE_WIDGET", payload: id })
  }, [])

  const updateWidget = useCallback((id: string, updates: Partial<WidgetInstance>) => {
    dispatch({ type: "UPDATE_WIDGET", payload: { id, updates } })
  }, [])

  const updateLayout = useCallback((layouts: { id: string; layout: WidgetLayout }[]) => {
    dispatch({ type: "UPDATE_LAYOUT", payload: layouts })
  }, [])

  const selectWidget = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_WIDGET", payload: id })
  }, [])

  const setEditing = useCallback((editing: boolean) => {
    dispatch({ type: "SET_EDITING", payload: editing })
  }, [])

  const setDrawerOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_DRAWER_OPEN", payload: open })
  }, [])

  const copyWidget = useCallback((id: string) => {
    dispatch({ type: "COPY_WIDGET", payload: id })
  }, [])

  const pasteWidget = useCallback(() => {
    dispatch({ type: "PASTE_WIDGET" })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: "REDO" })
  }, [])

  const loadDashboard = useCallback((config: DashboardConfig) => {
    dataSourceManager.stopAllAutoRefresh()
    dispatch({ type: "LOAD_DASHBOARD", payload: config })
  }, [])

  const resetDashboard = useCallback(() => {
    dataSourceManager.stopAllAutoRefresh()
    dispatch({ type: "RESET_DASHBOARD" })
  }, [])

  const refreshWidget = useCallback(
    (id: string) => {
      const widget = state.config.widgets.find((w) => w.id === id)
      if (!widget) return

      const definition = WidgetRegistry.get(widget.type)
      const dataSource = widget.dataSource ?? definition?.defaultDataSource
      if (!dataSource) return

      dataSourceManager
        .fetch(id, dataSource, { forceRefresh: true })
        .then((result) => {
          dispatch({
            type: "SET_DATA_STATE",
            payload: {
              id,
              state: {
                status: "success",
                data: result.data,
                error: null,
                lastUpdated: result.meta?.timestamp ?? new Date(),
                refreshCount: 0,
              },
            },
          })
        })
        .catch((error) => {
          dispatch({
            type: "SET_DATA_STATE",
            payload: {
              id,
              state: {
                status: "error",
                data: null,
                error: error instanceof Error ? error : new Error(String(error)),
                lastUpdated: null,
                refreshCount: 0,
              },
            },
          })
        })
    },
    [state.config.widgets]
  )

  const exportDashboard = useCallback(() => {
    return JSON.stringify(
      {
        version: DASHBOARD_VERSION,
        exportedAt: new Date().toISOString(),
        dashboard: state.config,
      },
      null,
      2
    )
  }, [state.config])

  const importDashboard = useCallback(
    (json: string) => {
      try {
        const parsed = JSON.parse(json)
        if (parsed.dashboard) {
          loadDashboard(parsed.dashboard)
        }
      } catch (error) {
        console.error("Failed to import dashboard:", error)
      }
    },
    [loadDashboard]
  )

  const value: DashboardContextValue = {
    state,
    addWidget,
    removeWidget,
    updateWidget,
    updateLayout,
    selectWidget,
    setEditing,
    setDrawerOpen,
    copyWidget,
    pasteWidget,
    undo,
    redo,
    loadDashboard,
    resetDashboard,
    refreshWidget,
    exportDashboard,
    importDashboard,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

/**
 * Hook to access dashboard context
 */
export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}

/**
 * Hook to access a specific widget's data state
 */
export function useWidgetDataState(id: string): DataSourceState | undefined {
  const { state } = useDashboard()
  return state.dataSourceStates[id]
}
