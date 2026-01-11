import { Route, Routes } from "react-router"

import IndexPage from "./pages"
import ConfigureClientsPage from "./pages/clients/configure"
import ClientsPage from "./pages/clients/index"
import ExtensionsIndex from "./pages/extensions"
import PluginBrowser from "./pages/extensions/plugins"
import PluginIdPage from "./pages/pluginId"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/clients/configure" element={<ConfigureClientsPage />} />
      <Route path="/p/:pluginId/*" element={<PluginIdPage />} />
      <Route path="/extensions" element={<ExtensionsIndex />} />
      <Route path="/extensions/plugins" element={<PluginBrowser />} />
    </Routes>
  )
}
