/**
 * Widgets database table accessor.
 *
 * Thin wrapper around a QueryBuilder that provides semantically named
 * methods for CRUD operations on the `widgets` table.
 */

import type { QueryBuilder } from "@dockstat/sqlite-wrapper"
import type { WidgetDefinition } from "../types"

export class WidgetsStore {
  constructor(private table: QueryBuilder<any>) {}

  /** List all widgets */
  list(): WidgetDefinition[] {
    return this.table.select(["*"]).all() as WidgetDefinition[]
  }

  /** Find a single widget by id */
  getById(id: string): WidgetDefinition | undefined {
    return (this.table.select(["*"]).where({ id }).get() ?? undefined) as WidgetDefinition | undefined
  }

  /** Find a single widget by name */
  getByName(name: string): WidgetDefinition | undefined {
    return (this.table.select(["*"]).where({ name }).get() ?? undefined) as WidgetDefinition | undefined
  }

  /** Create a new widget */
  create(data: Omit<WidgetDefinition, "createdAt" | "updatedAt">): WidgetDefinition {
    this.table.insert({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    return this.getById(data.id)!
  }

  /** Update a widget by id */
  update(id: string, data: Partial<Omit<WidgetDefinition, "id" | "createdAt">>): WidgetDefinition | undefined {
    this.table.where({ id }).update({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return this.getById(id)
  }

  /** Delete a widget by id, returns true if deleted */
  delete(id: string): boolean {
    const existing = this.getById(id)
    if (!existing) return false
    this.table.where({ id }).delete()
    return true
  }

  /** Check if a widget exists by id */
  exists(id: string): boolean {
    return this.getById(id) !== undefined
  }

  /** Get all widget names (for import validation) */
  getAllNames(): string[] {
    return this.table.select(["name"]).all().map((w) => w.name)
  }

  /** Get all widget ids */
  getAllIds(): string[] {
    return this.table.select(["id"]).all().map((w) => w.id)
  }

  /** Bulk insert widgets (used during import) */
  bulkInsert(widgets: Omit<WidgetDefinition, "createdAt" | "updatedAt">[]): void {
    const now = new Date().toISOString()
    for (const widget of widgets) {
      this.table.insert({ ...widget, createdAt: now, updatedAt: now })
    }
  }

  /** Search widgets by keyword (matches name, label, description, category) */
  search(query: string): WidgetDefinition[] {
    const all = this.list()
    const lower = query.toLowerCase()
    return all.filter(
      (w) =>
        w.name.toLowerCase().includes(lower) ||
        w.label.toLowerCase().includes(lower) ||
        w.description.toLowerCase().includes(lower) ||
        w.category.toLowerCase().includes(lower)
    )
  }

  /** Count total widgets */
  count(): number {
    return this.list().length
  }
}
