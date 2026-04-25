import { Button, Card, CardBody, CardHeader } from "@dockstat/ui"
import { useContext, useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { AnimatedIconBackground } from "@/components/auth/SignInBg"
import { EdenClientContext } from "@/contexts/edenClient"
import { floatingIcons } from "../SignIn"

const API_BASE_URL = "http://localhost:3030/api/v2"

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
  )
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

async function verifyToken(): Promise<{ user: unknown }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Verification failed with status ${response.status}`)
  }

  return response.json()
}

function AuthCallback() {
  const edenClient = useContext(EdenClientContext)
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getCookie("auth_token")

    if (!token) {
      setError("Missing authentication token")
      return
    }

    verifyToken()
      .then((data) => {
        if (!data.user) {
          throw new Error("Invalid token payload: missing user")
        }

        // Store user info and token
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("auth_token", token)
        edenClient.setToken(token)

        // Delete the cookie since we've stored the token in localStorage
        deleteCookie("auth_token")

        // Redirect back to original page
        const redirect = localStorage.getItem("auth_redirect") || "/"
        localStorage.removeItem("auth_redirect")
        navigate(redirect)
      })
      .catch((err) => {
        deleteCookie("auth_token")
        edenClient.setToken("")
        console.error("Auth callback error:", err)
        setError("Failed to process authentication. Please try again.")
      })
  }, [navigate, edenClient])

  if (error) {
    return (
      <AnimatedIconBackground icons={floatingIcons}>
        <Card
          className="max-w-md w-full mx-auto"
          glass
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
      </AnimatedIconBackground>
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

export default AuthCallback
