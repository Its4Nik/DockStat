import { AuthProvider, useAuth } from "@dockstat/auth/client"
import { useEdenClient, WebSocketProvider } from "@dockstat/utils/react"
import { useEffect } from "react"
import { ConfigProvider } from "./additionalSettings"
import { EdenClientProvider } from "./edenClient"
import { PageHeadingProvider } from "./pageHeading"
import { ThemeProvider } from "./theme"
import { ThemeSidebarProvider } from "./themeSidebar"

const baseUrl = `${import.meta.env.DOCKSTAT_API_URL || "http://localhost:3030"}/api/v2`

function AuthEdenBridge({ children }: { children: React.ReactNode }) {
  const edenClient = useEdenClient()
  const { logout } = useAuth()

  useEffect(() => {
    edenClient.setOnUnauthorized(logout)
  }, [edenClient, logout])

  return <>{children}</>
}

export default function DockStatProviders({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode {
  return (
    <EdenClientProvider>
      <AuthProvider apiBase={baseUrl}>
        <AuthEdenBridge>
          <WebSocketProvider
            requireAuth
            url={`${baseUrl}/ws`}
          >
            <ThemeProvider>
              <ThemeSidebarProvider>
                <PageHeadingProvider>
                  <ConfigProvider>{children}</ConfigProvider>
                </PageHeadingProvider>
              </ThemeSidebarProvider>
            </ThemeProvider>
          </WebSocketProvider>
        </AuthEdenBridge>
      </AuthProvider>
    </EdenClientProvider>
  )
}
