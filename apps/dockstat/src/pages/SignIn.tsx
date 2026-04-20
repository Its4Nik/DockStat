import { Button, Card, CardBody, CardHeader, Input } from "@dockstat/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useAuth } from "@/hooks/useAuth"
import { api } from "@/lib/api"

interface OAuthProvider {
  id: string
  issuer_url: string
  client_id: string
  scopes: string
  created_at: Date
}

// Map issuer URLs to provider names and icons
function getProviderInfo(issuerUrl: string): { name: string; icon: string } {
  const lowerUrl = issuerUrl.toLowerCase()

  if (lowerUrl.includes("google.com")) {
    return { icon: "G", name: "Google" }
  }
  if (lowerUrl.includes("github.com")) {
    return { icon: "GH", name: "GitHub" }
  }
  if (lowerUrl.includes("microsoft.com") || lowerUrl.includes("login.microsoftonline.com")) {
    return { icon: "MS", name: "Microsoft" }
  }
  if (lowerUrl.includes("authentik")) {
    return { icon: "A", name: "Authentik" }
  }
  if (lowerUrl.includes("keycloak")) {
    return { icon: "K", name: "Keycloak" }
  }
  if (lowerUrl.includes("okta.com")) {
    return { icon: "O", name: "Okta" }
  }

  // Extract domain for custom providers
  try {
    const url = new URL(issuerUrl)
    const hostname = url.hostname
    const name = hostname.replace("accounts.", "").replace("login.", "")
    return {
      icon: name.slice(0, 2).toUpperCase(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }
  } catch {
    return { icon: "🔐", name: "OAuth Provider" }
  }
}

export function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setError("Missing authentication token")
      return
    }

    try {
      // Decode JWT token (payload is base64 encoded)
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )

      const { user } = JSON.parse(jsonPayload)

      if (!user) {
        throw new Error("Invalid token payload")
      }

      // Store user info
      localStorage.setItem("user", JSON.stringify(user))

      // Redirect back to original page
      const redirect = localStorage.getItem("auth_redirect") || "/"
      localStorage.removeItem("auth_redirect")
      navigate(redirect)
    } catch (err) {
      console.error("Auth callback error:", err)
      setError("Failed to process authentication. Please try again.")
    }
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card
          className="max-w-md w-full"
          size="lg"
          variant="error"
        >
          <CardHeader>
            <h2 className="text-xl font-bold">Authentication Failed</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm mb-4">{error}</p>
            <Button
              fullWidth
              onClick={() => navigate("/login")}
              variant="outline"
            >
              Try Again
            </Button>
            <Button
              className="mt-2"
              fullWidth
              onClick={() => navigate("/")}
              variant="ghost"
            >
              Go Home
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card
        className="max-w-md w-full"
        size="lg"
      >
        <CardBody>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4" />
            <p>Completing authentication...</p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export function SignInPage() {
  const { login, user } = useAuth()
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchProvider, setSearchProvider] = useState("")

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const response = await api.auth.providers.get()
      if (response.status === 200 && response.data) {
        setProviders(response.data)
      } else {
        setError("Failed to load authentication providers")
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err)
      setError("Failed to load authentication providers")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (providerId: string) => {
    login(providerId)
  }

  // If user is already authenticated, redirect to home
  if (user) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>
  }

  const filteredProviders = providers.filter((provider) => {
    if (!searchProvider) return true
    const info = getProviderInfo(provider.issuer_url)
    return info.name.toLowerCase().includes(searchProvider.toLowerCase())
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-background-alt">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary-text">Welcome Back</h1>
          <p className="text-lg text-secondary-text">Sign in to continue to DockStat</p>
        </div>

        {/* Search Box */}
        <div className="w-full max-w-md mx-auto">
          <Input
            className="text-lg"
            onChange={(v) => setSearchProvider(v)}
            placeholder="Search provider..."
            value={searchProvider}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <Card
            className="max-w-md mx-auto"
            size="lg"
          >
            <CardBody>
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4" />
                <p>Loading authentication providers...</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card
            className="max-w-md mx-auto"
            size="lg"
            variant="error"
          >
            <CardBody>
              <div className="text-center">
                <p className="mb-4">{error}</p>
                <Button
                  fullWidth
                  onClick={fetchProviders}
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Provider Cards Grid */}
        {!loading && !error && filteredProviders.length === 0 && (
          <Card
            className="max-w-md mx-auto"
            size="lg"
            variant="default"
          >
            <CardBody>
              <div className="text-center text-secondary-text">
                <p>No providers found</p>
              </div>
            </CardBody>
          </Card>
        )}

        {!loading && !error && filteredProviders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProviders.map((provider) => {
              const info = getProviderInfo(provider.issuer_url)
              return (
                <Card
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  hoverable
                  key={provider.id}
                  onClick={() => handleLogin(provider.id)}
                  variant="outlined"
                >
                  <CardBody>
                    <div className="flex items-center gap-4">
                      {/* Provider Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-alt flex items-center justify-center text-white font-bold text-lg">
                        {info.icon}
                      </div>

                      {/* Provider Name */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-text">{info.name}</h3>
                        <p className="text-xs text-secondary-text truncate">
                          {new URL(provider.issuer_url).hostname}
                        </p>
                      </div>

                      {/* Arrow Icon */}
                      <svg
                        className="flex-shrink-0 w-5 h-5 text-secondary-text"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 5l7 7-7 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}

        {/* Help Text */}
        {!loading && !error && (
          <div className="text-center text-sm text-secondary-text">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
            <p className="mt-2">Don't see your provider? Contact your administrator.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SignInPage
