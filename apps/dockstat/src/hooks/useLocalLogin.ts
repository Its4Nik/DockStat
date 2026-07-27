import { useEdenClient } from "@dockstat/utils/react"
import { useCallback, useState } from "react"
import { api } from "@/lib/api"

export function useLocalLogin({
  setError,
  error,
}: {
  setError: (err: string | null) => void
  error: string | null
}) {
  const eden = useEdenClient()
  const [formData, setFormData] = useState({ name: "", pass: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault()
      setError(null)
      setIsSubmitting(true)

      try {
        const { data, status } = await eden.call(api.auth.local.login.post as never, {
          body: { name: formData.name, pass: formData.pass },
          skipAuthHandler: true,
        })

        if (status === 401) {
          setError("Invalid username or password")
          return
        }

        if (status !== 200 && status !== 302) {
          setError("Login failed")
          return
        }

        const token = (data as { token?: string })?.token
        if (token) {
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
          eden.setToken(token)

          const redirect = localStorage.getItem("auth_redirect") || "/"
          localStorage.removeItem("auth_redirect")
          window.location.href = redirect
        }
      } catch (err) {
        console.error("Local login error:", err)
        const message = err instanceof Error ? err.message : "Login failed"
        setError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, eden, setError]
  )

  const updateField = useCallback((field: "name" | "pass", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const togglePassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  return {
    error,
    formData,
    handleSubmit,
    isSubmitting,
    showPassword,
    togglePassword,
    updateField,
  }
}
