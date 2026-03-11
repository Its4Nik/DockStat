/**
 * Widget Registry
 *
 * Singleton registry for managing widget definitions.
 * Provides type-safe registration and retrieval of widgets.
 */

import type { WidgetDefinition, WidgetInstance } from "../types"

/**
 * Widget Registry - Singleton pattern
 */
class WidgetRegistryClass {
  private widgets: Map<string, WidgetDefinition> = new Map()
  private categories: Map<string, Set<string>> = new Map()

  /**
   * Register a new widget definition
   */
  register<TConfig, TData>(definition: WidgetDefinition<TConfig, TData>): void {
    if (this.widgets.has(definition.type)) {
      console.warn(`Widget type "${definition.type}" is already registered. Overwriting.`)
    }

    this.widgets.set(definition.type, definition as WidgetDefinition)

    // Track by category
    const category = definition.category ?? "General"
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category)?.add(definition.type)
  }

  /**
   * Register multiple widgets at once
   */
  registerAll(definitions: WidgetDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition)
    }
  }

  /**
   * Get a widget definition by type
   */
  get<TConfig = Record<string, unknown>, TData = unknown>(
    type: string
  ): WidgetDefinition<TConfig, TData> | undefined {
    return this.widgets.get(type) as WidgetDefinition<TConfig, TData> | undefined
  }

  /**
   * Check if a widget type is registered
   */
  has(type: string): boolean {
    return this.widgets.has(type)
  }

  /**
   * Get all registered widget definitions
   */
  getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values())
  }

  /**
   * Get widget types by category
   */
  getByCategory(category: string): WidgetDefinition[] {
    const types = this.categories.get(category)
    if (!types) return []
    return Array.from(types)
      .map((type) => this.widgets.get(type))
      .filter((w): w is WidgetDefinition => w !== undefined)
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys())
  }

  /**
   * Search widgets by name, description, or tags
   */
  search(query: string): WidgetDefinition[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter((widget) => {
      const nameMatch = widget.name.toLowerCase().includes(lowerQuery)
      const descMatch = widget.description.toLowerCase().includes(lowerQuery)
      const tagMatch = widget.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
      return nameMatch || descMatch || (tagMatch ?? false)
    })
  }

  /**
   * Create a widget instance from a definition
   */
  createInstance(
    type: string,
    overrides?: Partial<Omit<WidgetInstance, "id" | "type">>
  ): WidgetInstance | null {
    const definition = this.get(type)
    if (!definition) {
      console.error(`Widget type "${type}" not found in registry`)
      return null
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    return {
      id,
      type,
      config: { ...definition.defaultConfig, ...overrides?.config },
      layout: { ...definition.defaultLayout, ...overrides?.layout },
      dataSource: overrides?.dataSource ?? definition.defaultDataSource,
      title: overrides?.title,
      visible: overrides?.visible ?? true,
    }
  }

  /**
   * Unregister a widget type
   */
  unregister(type: string): boolean {
    const widget = this.widgets.get(type)
    if (!widget) return false

    this.widgets.delete(type)

    // Remove from category tracking
    const category = widget.category ?? "General"
    this.categories.get(category)?.delete(type)

    return true
  }

  /**
   * Clear all registered widgets
   */
  clear(): void {
    this.widgets.clear()
    this.categories.clear()
  }
}

/**
 * Global widget registry instance
 */
export const WidgetRegistry = new WidgetRegistryClass()

/**
 * Decorator for registering a widget (for class-based components)
 */
export function RegisterWidget<TConfig = Record<string, unknown>, TData = unknown>(
  definition: Omit<WidgetDefinition<TConfig, TData>, "component">
) {
  return <T extends React.ComponentType<unknown>>(component: T) => {
    WidgetRegistry.register({
      ...definition,
      component,
    } as WidgetDefinition)
    return component
  }
}
