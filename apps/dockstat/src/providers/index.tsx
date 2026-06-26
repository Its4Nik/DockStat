import { AuthProvider } from "@dockstat/auth/client"
import { ConfigProvider } from "./additionalSettings"
import { EdenClientProvider } from "./edenClient"
import { PageHeadingProvider } from "./pageHeading"
import { ThemeProvider } from "./theme"
import { ThemeSidebarProvider } from "./themeSidebar"

export default function DockStatProviders({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <AuthProvider apiBase="http://localhost:3030/api/v2">
      <ThemeProvider>
        <ThemeSidebarProvider>
          <PageHeadingProvider>
            <EdenClientProvider>
              <ConfigProvider>{children}</ConfigProvider>
            </EdenClientProvider>
          </PageHeadingProvider>
        </ThemeSidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
