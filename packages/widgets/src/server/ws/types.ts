import type { DataPayload } from "../types"

export type WidgetWSTopic = { type: "dashboard"; dashboardId: string } | { type: "widgets" }

export type WidgetWSData = WidgetDataUpdate | WidgetListEvent | DashboardListEvent

interface WidgetDataUpdate {
  type: "data-update"
  dashboardId: string
  payloads: DataPayload[]
}

interface WidgetListEvent {
  type: "widget-list"
  widgets: unknown[]
}

interface DashboardListEvent {
  type: "dashboard-list"
  dashboards: unknown[]
}

/**
 * Resolve a widgets topic to a canonical key string.
 */
export function resolveWidgetTopicKey(topic: unknown): string {
  if (typeof topic === "string") return topic
  const t = topic as WidgetWSTopic
  if ("type" in t) {
    if (t.type === "dashboard") {
      return `widgets/dashboard/${t.dashboardId}`
    }
    if (t.type === "widgets") {
      return "widgets/all"
    }
  }
  return String(topic)
}
