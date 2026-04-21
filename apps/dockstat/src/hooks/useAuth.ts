import { useEffect, useState } from "react"

interface User {
  sub: string
  email?: string
  name?: string
  picture?: string
  [key: string]: unknown
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error] = useState<string | null>(null)

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3030/api/v2"

  // Check if user is already authenticated (on mount)
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  // Initiate login with a specific provider
  const login = (providerId: string) => {
    // Store the current location to redirect back after auth
    localStorage.setItem("auth_redirect", window.location.pathname)
    localStorage.setItem("auth_provider_id", providerId)
    window.location.href = `${API_BASE}/auth/${providerId}/login`
  }

  // Logout
  const logout = () => {
    localStorage.removeItem("user")
    const providerId = localStorage.getItem("auth_provider_id")
    localStorage.removeItem("auth_provider_id")
    const loc = window.location.href
    setUser(null)
    window.location.href = `${API_BASE}/auth/${providerId}/logout?redirectUri=${loc}`
  }

  return { error, loading, login, logout, user }
}
