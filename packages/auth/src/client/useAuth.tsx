import { useAuth as useAuthContext } from "./AuthProvider"

/**
 * @deprecated This hook is deprecated. Please use the new AuthProvider and import useAuth from "./AuthProvider" instead.
 *
 * The old hook-based approach has been replaced with a Context-based approach that provides better
 * state management, automatic token refresh, and cross-tab synchronization.
 *
 * To migrate:
 * 1. Wrap your app with AuthProvider
 * 2. Import useAuth from "./AuthProvider" instead
 * 3. Remove the API_BASE parameter (it's now provided by the AuthProvider)
 *
 * @example
 * ```tsx
 * import { AuthProvider, useAuth } from "@dockstat/auth/client"
 *
 * // Wrap your app
 * <AuthProvider apiBase="/api">
 *   <App />
 * </AuthProvider>
 *
 * // Use the hook
 * const { login, logout, user } = useAuth()
 * ```
 */
export function useAuth() {
  const contextAuth = useAuthContext()

  // Return the context-based auth, ignoring the API_BASE parameter
  // since it's now managed by the AuthProvider
  return contextAuth
}
