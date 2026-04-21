import { Navigate } from "react-router"
import { useAuth } from "./useAuth"

export function ProtectedRoute({
  children,
  api_base,
  loadingComponent,
}: {
  children: React.ReactNode
  api_base: string
  loadingComponent?: React.ReactNode
}) {
  const { user, loading } = useAuth({ API_BASE: api_base })

  if (loading) {
    if (loadingComponent) {
      return loadingComponent
    }
    return <div>Loading...</div>
  }

  if (!user) {
    // Save current location for post-login redirect
    localStorage.setItem("auth_redirect", window.location.pathname)
    return (
      <Navigate
        replace
        to="/login"
      />
    )
  }

  return <>{children}</>
}
