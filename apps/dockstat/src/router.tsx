import { Route, Routes } from "react-router"

import IndexPage from "./pages"
import ClientsPage from "./pages/clients"
import PluginIdPage from "./pages/pluginId"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
      <Route path="/clients" element={<ClientsPage />} />
      <Route path="/p/:pluginId/*" element={<PluginIdPage />} />
    </Routes>
  )
}
