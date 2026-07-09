/**
 * DashboardRepository — high-level service for managing dashboards.
 */

const nanoid = (size: number) => crypto.randomUUID().replace(/-/g, "").slice(0, size)
import type { Logger } from "@dockstat/logger"
import type {
  BreakpointLayouts,
  DashboardDefinition,
  DataPipeGraph,
  PlacedWidget,
} from "../types"
import { DashboardsStore } from "../db/dashboards-store"

export class DashboardRepository {
  constructor(
    private store: DashboardsStore,
    private log: Logger
  ) {}

  list(): DashboardDefinition[] {
    return this.store.list()
  }

  getById(id: string): DashboardDefinition | undefined {
    return this.store.getById(id)
  }

  getByName(name: string): DashboardDefinition | undefined {
    return this.store.getByName(name)
  }

  getDefault(): DashboardDefinition | undefined {
    return this.store.getDefault()
  }

  /**
   * Create a new dashboard.
   */
  create(input: {
    name: string
    label: string
    description?: string
    widgets?: PlacedWidget[]
    layouts?: BreakpointLayouts
    dataPipe?: DataPipeGraph
    isDefault?: boolean
    id?: string
  }): DashboardDefinition {
    const id = input.id ?? nanoid(16)

    if (this.store.exists(id)) {
      throw new Error(`Dashboard with id "${id}" already exists`)
    }
    if (this.store.getByName(input.name)) {
      throw new Error(`Dashboard with name "${input.name}" already exists`)
    }

    const dashboard = this.store.create({
      dataPipe: input.dataPipe ?? { nodes: [], edges: [] },
      description: input.description ?? "",
      id,
      isDefault: input.isDefault ?? false,
      label: input.label,
      layouts: input.layouts ?? {},
      name: input.name,
      widgets: input.widgets ?? [],
    })

    this.log.info(`Created dashboard "${input.name}" (${id})`)
    return dashboard
  }

  /**
   * Update an existing dashboard.
   */
  update(
    id: string,
    data: Partial<Omit<DashboardDefinition, "id" | "createdAt">>
  ): DashboardDefinition {
    const existing = this.store.getById(id)
    if (!existing) {
      throw new Error(`Dashboard with id "${id}" not found`)
    }

    if (data.name && data.name !== existing.name) {
      const conflict = this.store.getByName(data.name)
      if (conflict) {
        throw new Error(`Dashboard with name "${data.name}" already exists`)
      }
    }

    const updated = this.store.update(id, data)
    this.log.info(`Updated dashboard "${existing.name}" (${id})`)
    return updated!
  }

  delete(id: string): boolean {
    const dashboard = this.store.getById(id)
    if (!dashboard) return false
    const result = this.store.delete(id)
    if (result) {
      this.log.info(`Deleted dashboard "${dashboard.name}" (${id})`)
    }
    return result
  }

  /** Set a dashboard as default */
  setDefault(id: string): boolean {
    const result = this.store.setDefault(id)
    if (result) {
      this.log.info(`Set dashboard "${id}" as default`)
    }
    return result
  }

  /** Get total count */
  count(): number {
    return this.store.count()
  }
}
