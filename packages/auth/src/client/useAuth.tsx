import { useAuth as useAuthContext } from "./AuthProvider"

export function useAuth() {
  const contextAuth = useAuthContext()

  return contextAuth
}
