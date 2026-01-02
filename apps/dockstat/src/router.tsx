import { Route, Routes } from "react-router"
import IndexPage from "./pages"
import ClientsPage from "./pages/clients"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
      <Route path="/clients" element={<ClientsPage />} />
    </Routes>
  )
}
