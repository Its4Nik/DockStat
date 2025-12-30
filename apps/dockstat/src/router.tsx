import { Route, Routes } from "react-router"
import IndexPage from "./pages"

export default function DockStatRouter() {
  return (
    <Routes>
      <Route path="/" index element={<IndexPage />} />
    </Routes>
  )
}
