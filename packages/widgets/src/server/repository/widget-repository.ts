/**
 * WidgetRepository — high-level service for managing widgets.
 *
 * Wraps the database store with business logic such as id generation,
 * validation, and duplicate-prevention.
 */

const nanoid = (size: number) => crypto.randomUUID().replace(/-/g, "").slice(0, size)
import type { Logger } from "@dockstat/logger"
import type { WidgetConfig } from "../types"
import type { WidgetDefinition } from "../types"
import { WidgetsStore } from "../db/widgets-store"

export class WidgetRepository {
  constructor(
    private store: WidgetsStore,
    private log: Logger
  ) {}

  /** List all widgets */
  list(): WidgetDefinition[] {
    return this.store.list()
  }

  /** Get a widget by id */
  getById(id: string): WidgetDefinition | undefined {
    return this.store.getById(id)
  }

  /** Get a widget by name */
  getByName(name: string): WidgetDefinition | undefined {
    return this.store.getByName(name)
  }

  /**
   * Create a new widget.  Generates an id if none is provided.
   */
  create(input: {
    name: string
    label: string
    description?: string
    category?: string
    version?: string
    kind: string
    defaultConfig: WidgetConfig
    configSchema: Record<string, unknown>
    dataInputs?: string[]
    dataOutputs?: string[]
    rendererPath?: string
    icon?: string
    id?: string
  }): WidgetDefinition {
    const id = input.id ?? nanoid(16)

    if (this.store.exists(id)) {
      throw new Error(`Widget with id "${id}" already exists`)
    }
    if (this.store.getByName(input.name)) {
      throw new Error(`Widget with name "${input.name}" already exists`)
    }

    const widget = this.store.create({
      category: input.category ?? "general",
      configSchema: input.configSchema,
      dataInputs: input.dataInputs ?? [],
      dataOutputs: input.dataOutputs ?? [],
      defaultConfig: input.defaultConfig,
      description: input.description ?? "",
      icon: input.icon,
      id,
      kind: input.kind,
      label: input.label,
      name: input.name,
      rendererPath: input.rendererPath,
      version: input.version ?? "1.0.0",
    })

    this.log.info(`Created widget "${input.name}" (${id})`)
    return widget
  }

  /**
   * Update an existing widget.
   */
  update(
    id: string,
    data: Partial<Omit<WidgetDefinition, "id" | "createdAt">>
  ): WidgetDefinition {
    const existing = this.store.getById(id)
    if (!existing) {
      throw new Error(`Widget with id "${id}" not found`)
    }

    // Prevent name collisions if name is being changed
    if (data.name && data.name !== existing.name) {
      const conflict = this.store.getByName(data.name)
      if (conflict) {
        throw new Error(`Widget with name "${data.name}" already exists`)
      }
    }

    const updated = this.store.update(id, data)
    this.log.info(`Updated widget "${existing.name}" (${id})`)
    return updated!
  }

  /** Delete a widget by id */
  delete(id: string): boolean {
    const widget = this.store.getById(id)
    if (!widget) return false
    const result = this.store.delete(id)
    if (result) {
      this.log.info(`Deleted widget "${widget.name}" (${id})`)
    }
    return result
  }

  /** Search widgets */
  search(query: string): WidgetDefinition[] {
    return this.store.search(query)
  }

  /** Get total count */
  count(): number {
    return this.store.count()
  }

  /** Check if all given widget ids exist */
  validateIds(ids: string[]): { exists: string[]; missing: string[] } {
    const allIds = this.store.getAllIds()
    const allIdSet = new Set(allIds)
    return {
      exists: ids.filter((id) => allIdSet.has(id)),
      missing: ids.filter((id) => !allIdSet.has(id)),
    }
  }
}
