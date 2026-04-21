import { AuthProvider } from "@dockstat/auth/client"
import { ConfigProvider } from "./additionalSettings"
import { PageHeadingProvider } from "./pageHeading"
import { QueryClientProvider } from "./queryClient"
import { ThemeProvider } from "./theme"
import { ThemeSidebarProvider } from "./themeSidebar"

export default function DockStatProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <AuthProvider apiBase="http://localhost:3030/api/v2">
        <ThemeProvider>
          <ThemeSidebarProvider>
            <PageHeadingProvider>
              <ConfigProvider>{children}</ConfigProvider>
            </PageHeadingProvider>
          </ThemeSidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
