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
  const { token, isAuthenticated, logout } = useAuth()

  // Keep the Eden client bearer token in sync with auth state
  useEffect(() => {
    edenClient.setToken(isAuthenticated ? (token ?? "") : "")
  }, [edenClient, token, isAuthenticated])

  // On 401, clear auth state without a full-page redirect — the ProtectedRoute
  // will redirect to /login via React Router once isAuthenticated becomes false.
  useEffect(() => {
    edenClient.setOnUnauthorized(() => {
      edenClient.setToken("")
      logout({ skipRedirect: true })
    })
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
