/**
 * Column schema definitions for the widget & dashboard tables.
 *
 * These are plain objects following the sqlite-wrapper `ColumnDefinition`
 * shape so they can be passed directly to `db.createTable()`.
 */

import type { ColumnDefinition } from "@dockstat/sqlite-wrapper"

// ── Widgets table ───────────────────────────────────────────────────

export const widgetsColumns: Record<string, ColumnDefinition> = {
  category: {
    default: "general",
    notNull: true,
    type: "TEXT",
  },
  configSchema: {
    notNull: true,
    type: "JSON",
  },
  createdAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
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
  defaultConfig: {
    notNull: true,
    type: "JSON",
  },
  description: {
    default: "",
    notNull: true,
    type: "TEXT",
  },
  icon: {
    type: "TEXT",
  },
  id: {
    notNull: true,
    primaryKey: true,
    type: "TEXT",
  },
  kind: {
    notNull: true,
    type: "TEXT",
  },
  label: {
    notNull: true,
    type: "TEXT",
  },
  name: {
    notNull: true,
    type: "TEXT",
    unique: true,
  },
  rendererPath: {
    type: "TEXT",
  },
  updatedAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
  version: {
    default: "1.0.0",
    notNull: true,
    type: "TEXT",
  },
}

// ── Dashboards table ────────────────────────────────────────────────

export const dashboardsColumns: Record<string, ColumnDefinition> = {
  createdAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
  dataPipe: {
    default: '{"nodes":[],"edges":[]}',
    notNull: true,
    type: "JSON",
  },
  description: {
    default: "",
    notNull: true,
    type: "TEXT",
  },
  id: {
    notNull: true,
    primaryKey: true,
    type: "TEXT",
  },
  isDefault: {
    default: 0,
    notNull: true,
    type: "BOOLEAN",
  },
  label: {
    notNull: true,
    type: "TEXT",
  },
  layouts: {
    default: "{}",
    notNull: true,
    type: "JSON",
  },
  name: {
    notNull: true,
    type: "TEXT",
    unique: true,
  },
  updatedAt: {
    default: "(datetime('now'))",
    notNull: true,
    type: "TEXT",
  },
  widgets: {
    default: "[]",
    notNull: true,
    type: "JSON",
  },
}
