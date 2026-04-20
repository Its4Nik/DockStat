import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Save current location for post-login redirect
    localStorage.setItem("auth_redirect", window.location.pathname);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
