import CreateRoutes from "./lib/protectedRoute"
import IndexPage from "./pages"
import AuthCallback from "./pages/auth/Callback"
import SignInPage from "./pages/auth/SignIn"
import ConfigureClientsPage from "./pages/clients/configure"
import ClientsPage from "./pages/clients/index"
import ExtensionsIndex from "./pages/extensions"
import PluginBrowser from "./pages/extensions/plugins"
import GraphPage from "./pages/graph"
import DockNodePage from "./pages/node"
import NodeStacksPage from "./pages/node/stacks"
import PluginIdPage from "./pages/pluginId"
import SettingsPage from "./pages/settings"

export default function DockStatRouter() {
  return (
    <CreateRoutes
      protectedRoutes={[
        { element: <IndexPage />, path: "/" },
        { element: <GraphPage />, path: "/graph" },
        { element: <SettingsPage />, path: "/settings" },
        { element: <DockNodePage />, path: "/node" },
        { element: <NodeStacksPage />, path: "/node/stacks" },
        { element: <ClientsPage />, path: "/clients" },
        { element: <ConfigureClientsPage />, path: "/client/configure" },
        { element: <PluginIdPage />, path: "/p/:pluginId/*" },
        { element: <ExtensionsIndex />, path: "/extensions" },
        { element: <PluginBrowser />, path: "/extensions/plugins" },
      ]}
      routes={[
        { element: <SignInPage />, path: "/login" },
        { element: <AuthCallback />, path: "/auth/:providerId/callback" },
      ]}
    />
  )
}
