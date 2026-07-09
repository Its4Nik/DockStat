/**
 * Column schema definitions for the widget & dashboard tables.
 *
 * These are plain objects following the sqlite-wrapper `ColumnDefinition`
 * shape so they can be passed directly to `db.createTable()`.
 */

import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"

// ── Widgets table ───────────────────────────────────────────────────

export const widgetsColumns: Record<string, ColumnDefinition> = {
  id: {
    notNull: true,
    primaryKey: true,
    type: "TEXT",
  },
  name: {
    notNull: true,
    type: "TEXT",
    unique: true,
  },
  label: {
    notNull: true,
    type: "TEXT",
  },
  description: {
    default: "",
    notNull: true,
    type: "TEXT",
  },
  category: {
    default: "general",
    notNull: true,
    type: "TEXT",
  },
  version: {
    default: "1.0.0",
    notNull: true,
    type: "TEXT",
  },
  kind: {
    notNull: true,
    type: "TEXT",
  },
  defaultConfig: {
    notNull: true,
    type: "JSON",
  },
  configSchema: {
    notNull: true,
    type: "JSON",
  },
  dataInputs: {
    default: "[]",
    notNull: true,
    type: "JSON",
  },
  dataOutputs: {
    default: "[]",
    notNull: true,
    type: "JSON",
  },
  rendererPath: {
    type: "TEXT",
  },
  icon: {
    type: "TEXT",
  },
  createdAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
  updatedAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
}

// ── Dashboards table ────────────────────────────────────────────────

export const dashboardsColumns: Record<string, ColumnDefinition> = {
  id: {
    notNull: true,
    primaryKey: true,
    type: "TEXT",
  },
  name: {
    notNull: true,
    type: "TEXT",
    unique: true,
  },
  label: {
    notNull: true,
    type: "TEXT",
  },
  description: {
    default: "",
    notNull: true,
    type: "TEXT",
  },
  widgets: {
    default: "[]",
    notNull: true,
    type: "JSON",
  },
  layouts: {
    default: "{}",
    notNull: true,
    type: "JSON",
  },
  dataPipe: {
    default: '{"nodes":[],"edges":[]}',
    notNull: true,
    type: "JSON",
  },
  isDefault: {
    default: 0,
    notNull: true,
    type: "BOOLEAN",
  },
  createdAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
  updatedAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
}
