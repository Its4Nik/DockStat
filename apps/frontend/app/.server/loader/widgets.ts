import { NODE_TEMPLATES } from "@dockstat/widgets/server"
import { fail, type RouteArgs } from "../lib/http"
import Singletons from "../singletons"

export const WidgetLoaders = {
  getDashboard: ({ params }: RouteArgs<{ id: string }>) => {
    const dashboard = Singletons.Widgets.dashboards.getById(params.id as string)
    if (!dashboard) return fail(404, `Dashboard "${params.id}" not found`)
    return dashboard
  },
  getDataPipeProviders: () => ({ providers: [] as string[], transformers: [] as string[] }),
  getDataPipeTemplates: () =>
    NODE_TEMPLATES({ getWsTopics: () => Singletons.WS.availableTopics() }),
  getDefaultDashboard: () =>
    Singletons.Widgets.dashboards.getDefault() ?? fail(404, "No default dashboard set"),
  getWidget: ({ params }: RouteArgs<{ id: string }>) => {
    const widget = Singletons.Widgets.widgets.getById(params.id as string)
    if (!widget) return fail(404, `Widget "${params.id}" not found`)
    return widget
  },
  listDashboards: () => Singletons.Widgets.dashboards.list(),
  listWidgets: () => Singletons.Widgets.widgets.list(),
  searchWidgets: ({ params }: RouteArgs<{ query: string }>) =>
    Singletons.Widgets.widgets.search(params.query as string),
}
