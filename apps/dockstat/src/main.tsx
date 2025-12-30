import { StrictMode } from "react"
import { BrowserRouter } from "react-router"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "./index.css"
import "@dockstat/ui/css"
import DockStatRouter from "./router"
import Layout from "./layout"

const queryClient = new QueryClient()

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <DockStatRouter />
        </Layout>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
