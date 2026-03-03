import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { Layout } from "./layout"
import DockStatProviders from "./providers"
import DockStatRouter from "./router"

import "@dockstat/ui/css"
import "./index.css"

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <DockStatProviders>
        <Layout>
          <DockStatRouter />
        </Layout>
      </DockStatProviders>
    </BrowserRouter>
  </StrictMode>
)
