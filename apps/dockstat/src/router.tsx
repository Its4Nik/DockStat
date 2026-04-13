import { Route, Routes } from "react-router"

import IndexPage from "./pages"
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
    <Routes>
      <Route
        element={<IndexPage />}
        index
        path="/"
      />
      <Route
        element={<GraphPage />}
        path="/graph"
      />
      <Route
        element={<SettingsPage />}
        path="/settings"
      />
      <Route
        element={<DockNodePage />}
        path="/node"
      />
      <Route
        element={<NodeStacksPage />}
        path="/node/stacks"
      />
      <Route
        element={<ClientsPage />}
        path="/clients"
      />
      <Route
        element={<ConfigureClientsPage />}
        path="/clients/configure"
      />
      <Route
        element={<PluginIdPage />}
        path="/p/:pluginId/*"
      />
      <Route
        element={<ExtensionsIndex />}
        path="/extensions"
      />
      <Route
        element={<PluginBrowser />}
        path="/extensions/plugins"
      />
    </Routes>
  )
}
