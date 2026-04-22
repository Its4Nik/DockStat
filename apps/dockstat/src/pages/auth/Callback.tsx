import { Button, Card, CardBody, CardHeader } from "@dockstat/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"

function AuthCallback() {
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
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join("")
      )

      const { user } = JSON.parse(jsonPayload)

      if (!user) {
        throw new Error("Invalid token payload")
      }

      // Store user info
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("auth_token", token)

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

export default AuthCallback
