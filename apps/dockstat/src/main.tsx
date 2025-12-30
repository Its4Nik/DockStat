import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"

import "./index.css"
import "@dockstat/ui/css"
import Layout from "./layout"
import DockStatRouter from "./router"

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
