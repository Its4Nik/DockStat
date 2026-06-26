import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import ProviderGuard from "./guard"
import { QueryClientProvider } from "./providers/queryClient"
import DockStatRouter from "./router"

// @ts-expect-error
import "@dockstat/ui/css"
// @ts-expect-error
import "./index.css"

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider>
      <BrowserRouter>
        <ProviderGuard>
          <DockStatRouter />
        </ProviderGuard>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
