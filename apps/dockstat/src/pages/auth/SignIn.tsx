import { useAuth } from "@dockstat/auth/client"
import { Button, Card, CardBody, CardHeader, Input } from "@dockstat/ui"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { getProviderInfo } from "./getProviderInfo"

interface OAuthProvider {
  id: string
  issuer_url: string
  client_id: string
  scopes: string
  created_at: Date
}

export function SignInPage() {
  const { login } = useAuth()

  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchProvider, setSearchProvider] = useState("")

  // Local auth state
  const [localUsersExist, setLocalUsersExist] = useState(false)
  const [localChecking, setLocalChecking] = useState(true)
  const [localLoginData, setLocalLoginData] = useState({ name: "", pass: "" })
  const [localLoginError, setLocalLoginError] = useState<string | null>(null)
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false)

  useEffect(() => {
    fetchProviders()
    checkLocalUsers()
  }, [])

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true)
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
      setProvidersLoading(false)
    }
  }

  const handleLogin = (providerId: string) => {
    login(providerId)
  }

  const checkLocalUsers = async () => {
    try {
      setLocalChecking(true)
      const response = await api.auth.local.exists.get()
      if (response.status === 200 && response.data) {
        setLocalUsersExist(response.data.exists)
      }
    } catch (err) {
      console.error("Failed to check local users:", err)
      setLocalUsersExist(false)
    } finally {
      setLocalChecking(false)
    }
  }

  const handleLocalLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLocalLoginError(null)
    setIsSubmittingLocal(true)

    try {
      const response = await api.auth.local.login.post({
        name: localLoginData.name,
        pass: localLoginData.pass,
      })

      if (response.status === 401) {
        setLocalLoginError("Invalid username or password")
        return
      }

      if (response.status !== 200 && response.status !== 302) {
        setLocalLoginError("Login failed. Please try again.")
        return
      }

      // The backend will redirect to the callback URL
      // But if we get here, handle it manually
      const token = response.data?.token
      if (token) {
        // Decode and store token
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join("")
        )

        const { user } = JSON.parse(jsonPayload)
        localStorage.setItem("user", JSON.stringify(user))
        localStorage.setItem("auth_token", token)
        localStorage.setItem("auth_provider_id", "local")

        const redirect = localStorage.getItem("auth_redirect") || "/"
        localStorage.removeItem("auth_redirect")
        window.location.href = redirect
      }
    } catch (err) {
      console.error("Local login error:", err)
      setLocalLoginError("Login failed. Please try again.")
    } finally {
      setIsSubmittingLocal(false)
    }
  }

  // ProtectedRoute will handle authenticated user redirects
  // This page only shows the login form for unauthenticated users

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
        {providersLoading && (
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

        {/* Local Login Card - Only shows if local users exist */}
        {!localChecking && localUsersExist && (
          <Card
            className="max-w-md mx-auto"
            size="lg"
            variant="outlined"
          >
            <CardHeader>
              <h2 className="text-xl font-bold text-primary-text">Local Account</h2>
              <p className="text-sm text-secondary-text">Sign in with your local account</p>
            </CardHeader>
            <CardBody>
              <form
                className="space-y-4"
                onSubmit={handleLocalLogin}
              >
                <div>
                  <p className="block text-sm font-medium text-primary-text mb-1">Username</p>
                  <Input
                    disabled={isSubmittingLocal}
                    onChange={(v) => setLocalLoginData({ ...localLoginData, name: v })}
                    placeholder="Enter your username"
                    value={localLoginData.name}
                  />
                </div>
                <div>
                  <p className="block text-sm font-medium text-primary-text mb-1">Password</p>
                  <Input
                    disabled={isSubmittingLocal}
                    onChange={(v) => setLocalLoginData({ ...localLoginData, pass: v })}
                    placeholder="Enter your password"
                    type="password"
                    value={localLoginData.pass}
                  />
                </div>

                {localLoginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{localLoginError}</p>
                  </div>
                )}

                <Button
                  disabled={isSubmittingLocal || !localLoginData.name || !localLoginData.pass}
                  fullWidth
                  type="submit"
                >
                  {isSubmittingLocal ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Provider Cards Grid */}
        {!providersLoading && !error && filteredProviders.length === 0 && (
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

        {!providersLoading && !error && filteredProviders.length > 0 && (
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
                      <ArrowRight size={20} />
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}

        {/* Help Text */}
        {!providersLoading && !error && !localChecking && (
          <div className="text-center text-sm text-secondary-text">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
            {!localUsersExist && (
              <p className="mt-2">Don't see your provider? Contact your administrator.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SignInPage
