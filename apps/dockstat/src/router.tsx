import { Route, Routes } from "react-router"

import IndexPage from "./pages"
import ClientsPage from "./pages/clients"
import PluginBrowser from "./pages/extensions/plugins"
import PluginIdPage from "./pages/pluginId"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/p/:pluginId/*" element={<PluginIdPage />} />
      <Route path="/extensions" />
      <Route path="/extensions/plugins" element={<PluginBrowser />} />
    </Routes>
  )
}
