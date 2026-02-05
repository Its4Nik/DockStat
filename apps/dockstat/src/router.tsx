import { Route, Routes } from "react-router"

import IndexPage from "./pages"
import ConfigureClientsPage from "./pages/clients/configure"
import ClientsPage from "./pages/clients/index"
import ExtensionsIndex from "./pages/extensions"
import PluginBrowser from "./pages/extensions/plugins"
import PluginIdPage from "./pages/pluginId"
import NodeStacksPage from "./pages/node/stacks"
import DockNodePage from "./pages/node"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
      <Route path="/node" element={<DockNodePage />} />
      <Route path="/node/stacks" element={<NodeStacksPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/clients/configure" element={<ConfigureClientsPage />} />
      <Route path="/p/:pluginId/*" element={<PluginIdPage />} />
      <Route path="/extensions" element={<ExtensionsIndex />} />
      <Route path="/extensions/plugins" element={<PluginBrowser />} />
    </Routes>
  )
}
