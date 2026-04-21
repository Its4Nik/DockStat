import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"

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
  logout: () => void
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
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
    isAuthenticated: false,
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
        user,
        token: storedToken,
        loading: false,
        error: null,
        isAuthenticated: !!user && !!storedToken,
      })
    } catch (error) {
      console.error("Failed to load auth state:", error)
      localStorage.removeItem(tokenStorageKey)
      localStorage.removeItem(userStorageKey)
      setState((prev) => ({
        ...prev,
        user: null,
        token: null,
        loading: false,
        error: "Failed to load authentication state",
        isAuthenticated: false,
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

  const logout = useCallback(async () => {
    try {
      const providerId = localStorage.getItem("auth_provider_id")
      const currentLocation = window.location.href

      // Clear local storage
      localStorage.removeItem(tokenStorageKey)
      localStorage.removeItem(userStorageKey)
      localStorage.removeItem("auth_provider_id")

      // Update state
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      })

      // Redirect to logout endpoint if provider ID exists
      if (providerId) {
        const logoutUrl = `${apiBase}/auth/${providerId}/logout?redirectUri=${currentLocation}`
        window.location.href = logoutUrl
      } else {
        // If no provider, just reload the page
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Logout failed:", error)
      setState((prev) => ({
        ...prev,
        error: "Logout failed",
      }))
    }
  }, [apiBase, tokenStorageKey, userStorageKey])

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
            logout()
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
        logout()
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
    const interval = setInterval(() => {
      refreshToken()
    }, 4 * 60 * 1000)

    return () => clearInterval(interval)
  }, [state.token, state.isAuthenticated, refreshToken])

  // Listen for auth callbacks from URL
  useEffect(() => {
    const handleAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get("token")

      if (token) {
        try {
          // Decode the JWT to get user info (in a real app, verify the signature)
          const parts = token.split(".")
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            const user = payload.user as User

            // Store token and user
            localStorage.setItem(tokenStorageKey, token)
            localStorage.setItem(userStorageKey, JSON.stringify(user))

            // Clear token from URL
            window.history.replaceState({}, "", window.location.pathname)

            // Update state
            setState({
              user,
              token,
              loading: false,
              error: null,
              isAuthenticated: true,
            })

            // Redirect to stored location or home
            const redirectPath = localStorage.getItem("auth_redirect") || "/"
            localStorage.removeItem("auth_redirect")
            window.location.href = redirectPath
          }
        } catch (error) {
          console.error("Failed to process auth callback:", error)
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to process authentication",
          }))
        }
      }
    }

    handleAuthCallback()
  }, [tokenStorageKey, userStorageKey])

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
    login,
    logout,
    refreshToken,
    clearError,
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
