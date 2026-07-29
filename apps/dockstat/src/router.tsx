import { Loader2 } from "lucide-react"
import { lazy, Suspense } from "react"
import CreateRoutes from "./lib/protectedRoute"

const IndexPage = lazy(() => import("./pages"))
const AuthCallback = lazy(() => import("./pages/auth/Callback"))
const ConfigureClientsPage = lazy(() => import("./pages/clients/configure"))
const ClientsPage = lazy(() => import("./pages/clients/index"))
const DashboardIndexPage = lazy(() => import("./pages/dashboard"))
const DashboardIdPage = lazy(() => import("./pages/dashboard/DashboardIdPage"))
const DataFlowFallback = lazy(() => import("./pages/dataflow/DataFlowFallback"))
const DataflowPage = lazy(() => import("./pages/dataflow/DataflowPage"))
const ExtensionsIndex = lazy(() => import("./pages/extensions"))
const PluginBrowser = lazy(() => import("./pages/extensions/plugins"))
const GraphPage = lazy(() => import("./pages/graph"))
const DockNodePage = lazy(() => import("./pages/node"))
const NodeStacksPage = lazy(() => import("./pages/node/stacks"))
const PluginIdPage = lazy(() => import("./pages/pluginId"))
const SignInPage = lazy(() => import("./pages/SignIn"))
const SettingsPage = lazy(() => import("./pages/settings"))

function RouteFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="size-6 animate-spin text-white/40" />
    </div>
  )
}

export default function DockStatRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <CreateRoutes
        protectedRoutes={[
          { element: <IndexPage />, path: "/" },
          { element: <GraphPage />, path: "/graph" },
          { element: <SettingsPage />, path: "/settings" },
          { element: <DockNodePage />, path: "/node" },
          { element: <NodeStacksPage />, path: "/node/stacks" },
          { element: <ClientsPage />, path: "/clients" },
          { element: <ConfigureClientsPage />, path: "/clients/configure" },
          { element: <PluginIdPage />, path: "/p/:pluginId/*" },
          { element: <ExtensionsIndex />, path: "/extensions" },
          { element: <PluginBrowser />, path: "/extensions/plugins" },
          { element: <DashboardIndexPage />, path: "/dashboard" },
          { element: <DashboardIdPage />, path: "/dashboard/:id" },
          { element: <DataFlowFallback />, path: "/dataflow" },
          { element: <DataflowPage />, path: "/dataflow/:id" },
        ]}
        routes={[
          { element: <SignInPage />, path: "/login" },
          { element: <AuthCallback />, path: "/auth/:providerId/callback" },
        ]}
      />
    </Suspense>
  )
}
