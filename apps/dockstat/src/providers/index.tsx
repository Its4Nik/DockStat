import { AuthProvider } from "@dockstat/auth/client"
import { WebSocketProvider } from "@dockstat/utils/react"
import { ConfigProvider } from "./additionalSettings"
import { EdenClientProvider } from "./edenClient"
import { PageHeadingProvider } from "./pageHeading"
import { ThemeProvider } from "./theme"
import { ThemeSidebarProvider } from "./themeSidebar"

const baseUrl = `${import.meta.env.DOCKSTAT_API_URL || "http://localhost:3030"}/api/v2`

export default function DockStatProviders({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode {
  return (
    <AuthProvider apiBase={baseUrl}>
      <WebSocketProvider
        requireAuth
        url={`${baseUrl}/ws`}
      >
        <ThemeProvider>
          <ThemeSidebarProvider>
            <PageHeadingProvider>
              <EdenClientProvider>
                <ConfigProvider>{children}</ConfigProvider>
              </EdenClientProvider>
            </PageHeadingProvider>
          </ThemeSidebarProvider>
        </ThemeProvider>
      </WebSocketProvider>
    </AuthProvider>
  )
}
