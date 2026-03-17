import { t } from "elysia"

/**
 * Dashboard Types for Elysia Validation
 */

// -------------------------------------------
// Widget Core Types
// -------------------------------------------

export const WidgetLayout = t.Object({
  x: t.Number(),
  y: t.Number(),
  w: t.Number(),
  h: t.Number(),
  minW: t.Optional(t.Number()),
  minH: t.Optional(t.Number()),
  maxW: t.Optional(t.Number()),
  maxH: t.Optional(t.Number()),
  static: t.Optional(t.Boolean()),
})

export const DataSourceConfig = t.Union([
  // REST
  t.Object({
    type: t.Literal("rest"),
    url: t.String(),
    method: t.Optional(t.Union([t.Literal("GET"), t.Literal("POST")])),
    headers: t.Optional(t.Record(t.String(), t.String())),
    // 'body' is unknown in TS, typically JSON value in runtime
    body: t.Optional(t.Unknown()),
    refreshInterval: t.Optional(t.Number()),
  }),
  // Static
  t.Object({
    type: t.Literal("static"),
    data: t.Unknown(),
  }),
  // Mock
  t.Object({
    type: t.Literal("mock"),
    generator: t.String(),
    interval: t.Optional(t.Number()),
  }),
  // WebSocket
  t.Object({
    type: t.Literal("websocket"),
    url: t.String(),
    reconnect: t.Optional(t.Boolean()),
  }),
  // GraphQL
  t.Object({
    type: t.Literal("graphql"),
    url: t.String(),
    query: t.String(),
    variables: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
])

export const WidgetConfigField = t.Object({
  name: t.String(),
  type: t.Union([
    t.Literal("text"),
    t.Literal("number"),
    t.Literal("boolean"),
    t.Literal("select"),
    t.Literal("color"),
    t.Literal("json"),
    t.Literal("range"),
  ]),
  label: t.String(),
  description: t.Optional(t.String()),
  required: t.Optional(t.Boolean()),
  defaultValue: t.Optional(t.Unknown()),
  options: t.Optional(
    t.Array(
      t.Object({
        label: t.String(),
        value: t.Unknown(),
      })
    )
  ),
  min: t.Optional(t.Number()),
  max: t.Optional(t.Number()),
  step: t.Optional(t.Number()),
  validation: t.Optional(
    t.Object({
      pattern: t.Optional(t.String()),
      min: t.Optional(t.Number()),
      max: t.Optional(t.Number()),
      message: t.Optional(t.String()),
    })
  ),
})

export const WidgetConfigSchema = t.Object({
  fields: t.Array(WidgetConfigField),
})

// We default TConfig to Record<string, unknown> as per your TS definition
export const WidgetInstance = t.Object({
  id: t.String(),
  type: t.String(),
  config: t.Record(t.String(), t.Unknown()),
  layout: WidgetLayout,
  dataSource: t.Optional(DataSourceConfig),
  title: t.Optional(t.String()),
  visible: t.Optional(t.Boolean()),
})

// -------------------------------------------
// Dashboard Core Types
// -------------------------------------------

export const DashboardGridConfig = t.Object({
  columns: t.Number(),
  rowHeight: t.Number(),
  gap: t.Optional(t.Number()),
  breakpoints: t.Optional(t.Record(t.String(), t.Number())),
  compact: t.Optional(t.Union([t.Boolean(), t.Literal("vertical"), t.Literal("horizontal")])),
  preventCollision: t.Optional(t.Boolean()),
})

export const TimeRange = t.Object({
  from: t.Union([t.String(), t.Date()]),
  to: t.Union([t.String(), t.Date()]),
  timeZone: t.Optional(t.String()),
})

export const DashboardTheme = t.Object({
  colorScheme: t.Optional(t.Union([t.Literal("light"), t.Literal("dark"), t.Literal("system")])),
  colors: t.Optional(t.Record(t.String(), t.String())),
  fontFamily: t.Optional(t.String()),
})

export const DashboardSettings = t.Object({
  refreshInterval: t.Optional(t.Number()),
  defaultTimeRange: t.Optional(TimeRange),
  theme: t.Optional(DashboardTheme),
  editMode: t.Optional(t.Boolean()),
  showBorders: t.Optional(t.Boolean()),
  background: t.Optional(t.String()),
})

export const DashboardConfig = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(t.String()),
  grid: DashboardGridConfig,
  // Strictly typed WidgetInstance array
  widgets: t.Array(WidgetInstance),
  settings: t.Optional(DashboardSettings),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  version: t.String(),
})

// -------------------------------------------
// Runtime State & History Types
// -------------------------------------------

export const DataSourceState = t.Object({
  loading: t.Optional(t.Boolean()),
  error: t.Optional(t.Union([t.String(), t.Null()])),
  data: t.Optional(t.Unknown()),
  lastUpdated: t.Optional(t.Date()),
})

export const DashboardHistoryEntry = t.Object({
  widgets: t.Array(WidgetInstance),
  timestamp: t.Date(),
  action: t.String(),
})

export const DashboardHistory = t.Object({
  past: t.Array(DashboardHistoryEntry),
  future: t.Array(DashboardHistoryEntry),
  maxSize: t.Number(),
})

export const DashboardState = t.Object({
  config: DashboardConfig,
  dataSourceStates: t.Record(t.String(), DataSourceState),
  selectedWidgetId: t.Union([t.String(), t.Null()]),
  isEditing: t.Boolean(),
  isDrawerOpen: t.Boolean(),
  isDirty: t.Boolean(),
  clipboard: t.Union([WidgetInstance, t.Null()]),
  history: DashboardHistory,
})

// -------------------------------------------
// Action Types
// -------------------------------------------

export const DashboardAction = t.Union([
  t.Object({ type: t.Literal("ADD_WIDGET"), payload: WidgetInstance }),
  t.Object({ type: t.Literal("REMOVE_WIDGET"), payload: t.String() }),
  t.Object({
    type: t.Literal("UPDATE_WIDGET"),
    payload: t.Object({
      id: t.String(),
      updates: t.Partial(WidgetInstance), // Partial<WidgetInstance>
    }),
  }),
  t.Object({
    type: t.Literal("UPDATE_LAYOUT"),
    payload: t.Array(
      t.Object({
        id: t.String(),
        layout: WidgetLayout,
      })
    ),
  }),
  t.Object({
    type: t.Literal("SELECT_WIDGET"),
    payload: t.Union([t.String(), t.Null()]),
  }),
  t.Object({ type: t.Literal("SET_EDITING"), payload: t.Boolean() }),
  t.Object({ type: t.Literal("SET_DRAWER_OPEN"), payload: t.Boolean() }),
  t.Object({
    type: t.Literal("SET_DATA_STATE"),
    payload: t.Object({
      id: t.String(),
      state: t.Partial(DataSourceState), // Partial<DataSourceState>
    }),
  }),
  t.Object({ type: t.Literal("SET_DIRTY"), payload: t.Boolean() }),
  t.Object({ type: t.Literal("COPY_WIDGET"), payload: t.String() }),
  t.Object({ type: t.Literal("PASTE_WIDGET") }),
  t.Object({ type: t.Literal("UNDO") }),
  t.Object({ type: t.Literal("REDO") }),
  t.Object({ type: t.Literal("LOAD_DASHBOARD"), payload: DashboardConfig }),
  t.Object({ type: t.Literal("RESET_DASHBOARD") }),
])

// -------------------------------------------
// Import/Export Types
// -------------------------------------------

export const DashboardExportOptions = t.Object({
  includeData: t.Optional(t.Boolean()),
  includeCredentials: t.Optional(t.Boolean()),
  compress: t.Optional(t.Boolean()),
})

export const DashboardExport = t.Object({
  version: t.String(),
  exportedAt: t.String(),
  dashboard: DashboardConfig,
  options: t.Optional(DashboardExportOptions),
})

export const DashboardImportResult = t.Object({
  success: t.Boolean(),
  dashboard: t.Optional(DashboardConfig),
  errors: t.Optional(t.Array(t.String())),
  warnings: t.Optional(t.Array(t.String())),
})

// -------------------------------------------
// Aggregated Model Export
// -------------------------------------------

export const DashboardModel = {
  // Widget
  WidgetLayout,
  DataSourceConfig,
  WidgetConfigField,
  WidgetConfigSchema,
  WidgetInstance,

  // Dashboard
  DashboardGridConfig,
  TimeRange,
  DashboardTheme,
  DashboardSettings,
  DashboardConfig,

  // State
  DataSourceState,
  DashboardHistoryEntry,
  DashboardHistory,
  DashboardState,

  // Actions & IO
  DashboardAction,
  DashboardExportOptions,
  DashboardExport,
  DashboardImportResult,
}
