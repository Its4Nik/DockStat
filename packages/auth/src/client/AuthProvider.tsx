import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react"

interface User {
  sub: string
  email?: string
  name?: string
  picture?: string
  [key: string]: unknown
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (providerId: string) => void
  logout: (options?: { skipRedirect?: boolean }) => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  apiBase: string
  tokenStorageKey?: string
  userStorageKey?: string
  onTokenExpired?: () => void
}

export function AuthProvider({
  children,
  apiBase,
  tokenStorageKey = "auth_token",
  userStorageKey = "user",
  onTokenExpired,
}: AuthProviderProps): React.ReactNode {
  const [state, setState] = useState<AuthState>({
    error: null,
    isAuthenticated: false,
    loading: true,
    token: null,
    user: null,
  })

  const loadAuthState = useCallback(() => {
    try {
      const storedToken = localStorage.getItem(tokenStorageKey)
      const storedUser = localStorage.getItem(userStorageKey)

      let user: User | null = null
      if (storedUser) {
        user = JSON.parse(storedUser)
      }

      setState({
        error: null,
        isAuthenticated: !!user && !!storedToken,
        loading: false,
        token: storedToken,
        user,
      })
    } catch (error) {
      console.error("Failed to load auth state:", error)
      localStorage.removeItem(tokenStorageKey)
      localStorage.removeItem(userStorageKey)
      setState((prev) => ({
        ...prev,
        error: "Failed to load authentication state",
        isAuthenticated: false,
        loading: false,
        token: null,
        user: null,
      }))
    }
  }, [tokenStorageKey, userStorageKey])

  const login = useCallback(
    (providerId: string) => {
      // Store the current location to redirect back after auth
      localStorage.setItem("auth_redirect", window.location.pathname)
      localStorage.setItem("auth_provider_id", providerId)

      // Redirect to the auth endpoint
      window.location.href = `${apiBase}/auth/${providerId}/login`
    },
    [apiBase]
  )

  const logout = useCallback(
    async (options?: { skipRedirect?: boolean }) => {
      try {
        const providerId = localStorage.getItem("auth_provider_id")
        const currentToken = localStorage.getItem(tokenStorageKey)
        const currentLocation = window.location.href

        // Revoke the session server-side so the JWT can no longer be used
        if (currentToken) {
          try {
            await fetch(`${apiBase}/auth/revoke`, {
              headers: { Authorization: `Bearer ${currentToken}` },
              method: "POST",
            })
          } catch {
            // Best-effort; continue with local cleanup
          }
        }

        // Clear local storage
        localStorage.removeItem(tokenStorageKey)
        localStorage.removeItem(userStorageKey)
        localStorage.removeItem("auth_provider_id")
        localStorage.removeItem("auth_redirect")

        // Clear the auth_token cookie client-side (backup to server-side removal)
        // biome-ignore lint/suspicious/noDocumentCookie: cookieStore.delete is unreliable cross-origin
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; sameSite=lax"

        // Update state
        setState({
          error: null,
          isAuthenticated: false,
          loading: false,
          token: null,
          user: null,
        })

        if (options?.skipRedirect) return

        // Redirect to logout endpoint if provider ID exists (for SSO end-session)
        if (providerId) {
          const logoutUrl = `${apiBase}/auth/${providerId}/logout?redirectUri=${currentLocation}`
          window.location.href = logoutUrl
        } else {
          window.location.href = "/"
        }
      } catch (error) {
        console.error("Logout failed:", error)
        setState((prev) => ({
          ...prev,
          error: "Logout failed",
        }))
      }
    },
    [apiBase, tokenStorageKey, userStorageKey]
  )

  const refreshToken = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem(tokenStorageKey)

      if (!currentToken) {
        throw new Error("No token available to refresh")
      }

      // Verify token validity by making a request to a protected endpoint
      // Adjust this endpoint based on your API
      const response = await fetch(`${apiBase}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token is expired or invalid
          if (onTokenExpired) {
            onTokenExpired()
          } else {
            await logout({ skipRedirect: true })
          }
        }
        throw new Error("Token validation failed")
      }

      // Token is valid, no action needed
      // If you implement refresh tokens, you would update the token here
    } catch (error) {
      console.error("Token refresh failed:", error)
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Token refresh failed",
      }))
      if (onTokenExpired) {
        onTokenExpired()
      } else {
        await logout({ skipRedirect: true })
      }
    }
  }, [apiBase, tokenStorageKey, logout, onTokenExpired])

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }))
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    loadAuthState()
  }, [loadAuthState])

  // Set up token refresh interval
  useEffect(() => {
    if (!state.token || !state.isAuthenticated) {
      return
    }

    // Refresh token every 4 minutes (assuming 5 minute token lifetime)
    const interval = setInterval(
      () => {
        refreshToken()
      },
      4 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [state.token, state.isAuthenticated, refreshToken])

  // Listen for storage changes (sync across tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === tokenStorageKey || e.key === userStorageKey) && e.newValue !== e.oldValue) {
        loadAuthState()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [loadAuthState, tokenStorageKey, userStorageKey])

  const contextValue: AuthContextType = {
    ...state,
    clearError,
    login,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context
 * Throws error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * Hook to check if user is authenticated
 * Returns true if user is logged in, false otherwise
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook to get current user
 * Returns user object if authenticated, null otherwise
 */
export function useUser(): User | null {
  const { user } = useAuth()
  return user
}

/**
 * Hook to check authentication status
 * Returns true if authentication is in progress
 */
export function useIsLoading(): boolean {
  const { loading } = useAuth()
  return loading
}

/**
 * Hook to get authentication error
 * Returns error message if present, null otherwise
 */
export function useAuthError(): string | null {
  const { error } = useAuth()
  return error
}
