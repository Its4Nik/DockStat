import { Route, Routes } from "react-router"

import IndexPage from "./pages"
import ClientsPage from "./pages/clients"
import PluginIdPage from "./pages/pluginId"
import ExtensionsIndex from "./pages/extensions"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/p/:pluginId/*" element={<PluginIdPage />} />
      <Route path="/extensions" element={<ExtensionsIndex />} />
    </Routes>
  )
}
