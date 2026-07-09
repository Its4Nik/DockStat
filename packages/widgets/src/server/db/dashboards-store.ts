/**
 * Dashboards database table accessor.
 */

import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { DashboardDefinition } from "../types"

// sqlite stores booleans as 0/1
function boolFromDb(val: number | boolean): boolean {
  return val === 1 || val === true
}

export class DashboardsStore {
  constructor(private table: QueryBuilder<any>) {}

  list(): DashboardDefinition[] {
    const rows = this.table.select(["*"]).all()
    return rows.map((row) => ({ ...row, isDefault: boolFromDb(row.isDefault) }))
  }

  getById(id: string): DashboardDefinition | undefined {
    const row = this.table.select(["*"]).where({ id }).get() ?? undefined
    return row ? { ...row, isDefault: boolFromDb(row.isDefault) } : undefined
  }

  getByName(name: string): DashboardDefinition | undefined {
    const row = this.table.select(["*"]).where({ name }).get() ?? undefined
    return row ? { ...row, isDefault: boolFromDb(row.isDefault) } : undefined
  }

  /** Get the dashboard marked as default */
  getDefault(): DashboardDefinition | undefined {
    const row = this.table.select(["*"]).where({ isDefault: 1 }).get() ?? undefined
    return row ? { ...row, isDefault: boolFromDb(row.isDefault) } : undefined
  }

  create(data: Omit<DashboardDefinition, "createdAt" | "updatedAt">): DashboardDefinition {
    this.table.insert({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return this.getById(data.id)!
  }

  update(id: string, data: Partial<Omit<DashboardDefinition, "id" | "createdAt">>): DashboardDefinition | undefined {
    this.table.where({ id }).update({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return this.getById(id)
  }

  delete(id: string): boolean {
    const existing = this.getById(id)
    if (!existing) return false
    this.table.where({ id }).delete()
    return true
  }

  exists(id: string): boolean {
    return this.getById(id) !== undefined
  }

  /**
   * Set a dashboard as the default.  Unsets any previously-default dashboard.
   */
  setDefault(id: string): boolean {
    const existing = this.getById(id)
    if (!existing) return false

    // Clear previous default
    const prev = this.getDefault()
    if (prev && prev.id !== id) {
      this.table.where({ id: prev.id }).update({ isDefault: false })
    }

    this.table.where({ id }).update({ isDefault: true })
    return true
  }

  /** Get all dashboard names */
  getAllNames(): string[] {
    return this.table.select(["name"]).all().map((d) => d.name)
  }

  /** Count total dashboards */
  count(): number {
    return this.list().length
  }
}
