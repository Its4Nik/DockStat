import { Navigate } from "react-router"
import { useAuth } from "./AuthProvider"

export function ProtectedRoute({
  children,
  loadingComponent,
  redirectTo = "/login",
}: {
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  redirectTo?: string
}) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    if (loadingComponent) {
      return loadingComponent
    }
    return <div>Loading...</div>
  }

  if (!isAuthenticated || !user) {
    // Save current location for post-login redirect
    localStorage.setItem("auth_redirect", window.location.pathname)
    return (
      <Navigate
        replace
        to={redirectTo}
      />
    )
  }

  return <>{children}</>
}
