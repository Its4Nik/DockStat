import { AuthProvider } from "@dockstat/auth/client"
import { useLocation } from "react-router"
import { Layout } from "./layout"
import DockStatProviders from "./providers"
import { EdenClientProvider } from "./providers/edenClient"

const Wrappers: Record<
  string,
  Array<({ children, key }: { children: React.ReactNode; key: unknown }) => React.ReactNode>
> = {
  Default: [EdenClientProvider, Layout, DockStatProviders],
  LoginOnly: [
    ({ children }: { children: React.ReactNode }) => (
  <EdenClientProvider>
      <AuthProvider apiBase="http://localhost:3030/api/v2">{children}</AuthProvider>
    </EdenClientProvider>
    ),
  ],
}

function ProviderGuard({ children }: { children: React.ReactNode }) {
  const pathname = useLocation().pathname
  const isLoginPage =
    pathname === "/login" || (pathname.startsWith("/auth") && pathname.endsWith("/callback"))

  if (isLoginPage) {
    return Wrappers.LoginOnly.reduce((acc, Wrapper) => {
      return <Wrapper key={`${Wrapper.name}-${Wrapper.length}`}>{acc}</Wrapper>
    }, children)
  }

  return Wrappers.Default.reduce((acc, Wrapper) => {
    return <Wrapper key={`${Wrapper.name}-${Wrapper.length}`}>{acc}</Wrapper>
  }, children)
}

export default ProviderGuard
